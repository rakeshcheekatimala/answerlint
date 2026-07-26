import { appendFileSync } from 'node:fs';
import { auditMarkdown } from '../../tui/audit-adapter.js';
import { TuiController } from '../../tui/controller.js';
import { validateWatchFile } from '../../tui/file-watcher.js';
import { renderDashboard } from '../../tui/renderer.js';

export type TuiOptions = { debounce: number; color: boolean; jsonDebug: boolean };
type RuntimeController = Pick<TuiController, 'state' | 'start' | 'close' | 'key'>;
type TuiRuntime = {
  interactive?: boolean;
  createController?: (file: string, debounce: number, draw: (state: Parameters<typeof renderDashboard>[0]) => void) => RuntimeController;
};

export async function runTui(input: string, options: TuiOptions, runtime: TuiRuntime = {}): Promise<() => void> {
  const filePath = validateWatchFile(input);
  const interactive = runtime.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const draw = (state: Parameters<typeof renderDashboard>[0]) => {
    if (interactive) process.stdout.write('\x1b[H\x1b[2J' + renderDashboard(state));
    if (options.jsonDebug) appendFileSync('answerlint-tui-debug.jsonl', JSON.stringify({ event: state.status, at: new Date().toISOString() }) + '\n');
  };
  const controller = runtime.createController?.(filePath, options.debounce, draw) ??
    new TuiController(filePath, options.debounce, draw, { audit: auditMarkdown });
  let originalRaw = false;
  const cleanup = () => {
    controller.close();
    process.off('SIGINT', onSignal);
    process.stdout.off('resize', onResize);
    process.stdin.off('data', onKey);
    if (process.stdin.isTTY) process.stdin.setRawMode(originalRaw);
    process.stdin.pause();
    if (interactive) process.stdout.write('\x1b[?25h\n');
  };
  const onSignal = () => { cleanup(); };
  const onResize = () => draw(controller.state);
  const onKey = (data: Buffer) => { if (data.toString() === '\u0003' || controller.key(data.toString()) === 'exit') cleanup(); };
  if (interactive) {
    originalRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true); process.stdin.resume();
    process.stdin.on('data', onKey); process.on('SIGINT', onSignal); process.stdout.on('resize', onResize);
    process.stdout.write('\x1b[?25l');
  }
  try { await controller.start(); } catch (error) { cleanup(); throw error; }
  return cleanup;
}
