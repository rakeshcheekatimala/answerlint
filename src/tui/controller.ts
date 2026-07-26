import { FSWatcher } from 'node:fs';
import { LiveAuditSnapshot, TuiState } from './types.js';
import { readStableFile, watchFile } from './file-watcher.js';

export type ControllerDeps = {
  audit: (file: string, content: string, previous?: LiveAuditSnapshot['scores']) => Promise<LiveAuditSnapshot>;
  read?: typeof readStableFile;
  watch?: typeof watchFile;
  setTimer?: (fn: () => void, ms: number) => NodeJS.Timeout;
  clearTimer?: (timer: NodeJS.Timeout) => void;
};

export class TuiController {
  state: TuiState = { status: 'loading', stale: false, selected: 0, expanded: false, failuresOnly: false, help: false, focus: 0 };
  private watcher?: FSWatcher;
  private timer?: NodeJS.Timeout;
  private running = false;
  private queued = false;
  private lastHash?: string;

  constructor(
    readonly filePath: string,
    private readonly debounceMs: number,
    private readonly render: (state: TuiState) => void,
    private readonly deps: ControllerDeps
  ) {}

  async start(): Promise<void> {
    this.render(this.state);
    this.watcher = (this.deps.watch ?? watchFile)(this.filePath, () => this.schedule(), (error) => this.fail('file-error', `Watcher failed: ${safeMessage(error)}`));
    await this.run();
  }

  schedule(): void {
    if (this.timer) (this.deps.clearTimer ?? clearTimeout)(this.timer);
    this.timer = (this.deps.setTimer ?? setTimeout)(() => void this.run(), this.debounceMs);
  }

  async run(force = false): Promise<void> {
    if (this.running) { this.queued = true; return; }
    this.running = true;
    try {
      const { content, hash } = await (this.deps.read ?? readStableFile)(this.filePath);
      if (!force && hash === this.lastHash) return;
      const snapshot = await this.deps.audit(this.filePath, content, this.state.snapshot?.scores);
      this.lastHash = hash;
      this.state = { ...this.state, status: 'success', snapshot, message: undefined, stale: false, selected: Math.min(this.state.selected, Math.max(0, snapshot.issues.length - 1)) };
      this.render(this.state);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const fileError = code === 'ENOENT' || code === 'ECHANGED' || code === 'EACCES';
      const temporary = code === 'ENOENT' || code === 'ECHANGED';
      this.fail(fileError ? 'file-error' : 'audit-error', temporary
        ? 'File is temporarily unavailable; waiting for the next save…'
        : safeMessage(error));
      if (temporary) this.schedule();
    } finally {
      this.running = false;
      if (this.queued) { this.queued = false; await this.run(); }
    }
  }

  key(key: string): 'exit' | void {
    if (key === 'q' && !this.state.help) return 'exit';
    if (key === '?' || (this.state.help && (key === 'q' || key === '\u001b'))) this.state.help = !this.state.help;
    else if (key === 'f') { this.state.failuresOnly = !this.state.failuresOnly; this.state.selected = 0; }
    else if (key === '\r') this.state.expanded = !this.state.expanded;
    else if (key === '\t') this.state.focus = (this.state.focus + 1) % 3;
    else if (key === '\u001b[Z') this.state.focus = (this.state.focus + 2) % 3;
    else if (key === '\u001b[A') this.state.selected = Math.max(0, this.state.selected - 1);
    else if (key === '\u001b[B') this.state.selected = Math.min(this.visibleIssues().length - 1, this.state.selected + 1);
    else if (key === 'r') void this.run(true);
    this.render(this.state);
  }

  visibleIssues() { return (this.state.snapshot?.issues ?? []).filter((issue) => !this.state.failuresOnly || issue.status === 'failed' || issue.status === 'warning'); }

  close(): void {
    if (this.timer) (this.deps.clearTimer ?? clearTimeout)(this.timer);
    this.watcher?.close();
  }

  private fail(status: 'file-error' | 'audit-error', message: string) {
    this.state = { ...this.state, status, message, stale: Boolean(this.state.snapshot) };
    this.render(this.state);
  }
}

export function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Audit failed. Save the file to try again.';
  return message.replace(/(?:file:\/\/)?(?:\/[\w ._-]+){2,}/g, '[local path]');
}
