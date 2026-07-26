import path from 'node:path';
import { scoreDelta } from './audit-adapter.js';
import { TuiState } from './types.js';

const stripAnsi = (value: string) => value.replace(/\x1b\[[0-9;]*m/g, '');
const fit = (value: string, width: number) => stripAnsi(value).length <= width ? value : stripAnsi(value).slice(0, Math.max(1, width - 1)) + '…';

export function renderDashboard(state: TuiState, columns = process.stdout.columns || 80): string {
  const width = Math.max(30, columns - 2);
  if (columns < 40) return `AnswerLint TUI\nTerminal too narrow (${columns} columns). Resize to at least 40 columns.\nq exit`;
  const snap = state.snapshot;
  const lines: string[] = ['┌' + '─'.repeat(width) + '┐'];
  const add = (text = '') => lines.push('│' + fit(' ' + text, width).padEnd(width) + '│');
  add(`File: ${snap ? path.relative(process.cwd(), snap.filePath) : 'Loading…'}`);
  add(state.status === 'success' ? 'Watching for saved changes…' : (state.message ?? 'Running initial audit…'));
  if (state.stale) add('Showing last successful scores (stale)');
  if (snap) {
    add(`Last checked ${new Date(snap.auditedAt).toLocaleTimeString()}`);
    add(''); add('Scores');
    for (const [label, key] of [['Composite','composite'], ['AEO','aeo'], ['GEO','geo'], ['Citation-ready','citationReadiness']] as const) {
      add(`${label.padEnd(17)} ${String(snap.scores[key]).padStart(3)}  ${scoreDelta(snap.scores[key], snap.previousScores?.[key])}`);
    }
    add(''); add('Improve first');
    snap.issues.slice(0, 3).forEach((issue, i) => add(`${i + 1}. ${issue.title} [${issue.severity}]`));
    add(''); add(`Checks: ${snap.passedChecks} passed · ${snap.warningChecks} warnings · ${snap.failedChecks} failed`);
    const issues = snap.issues.filter((i) => !state.failuresOnly || i.status !== undefined);
    issues.forEach((issue, i) => {
      add(`${i === state.selected ? '›' : ' '} ${issue.status === 'failed' ? '✗' : '!'} ${issue.title}`);
      if (i === state.selected && state.expanded) {
        add(`  Evidence: ${issue.evidence}`); add(`  Improve: ${issue.recommendation}`);
      }
    });
  }
  add(''); add('Tab navigate · Enter evidence · f failures · r refresh · ? help · q exit');
  if (state.help) { add(''); add('Up/Down checks · Shift+Tab previous panel · Ctrl+C exit'); add('Press ? or q to close help'); }
  lines.push('└' + '─'.repeat(width) + '┘');
  return lines.join('\n');
}
