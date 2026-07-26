import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { auditMarkdown, compareIssues, scoreDelta } from '../.test-dist/tui/audit-adapter.js';
import { safeMessage, TuiController } from '../.test-dist/tui/controller.js';
import { readStableFile, validateWatchFile, watchFile } from '../.test-dist/tui/file-watcher.js';
import { renderDashboard } from '../.test-dist/tui/renderer.js';
import { runTui } from '../.test-dist/cli/commands/tui.js';
import { createTempDir } from './helpers.ts';

test('watch validation accepts Markdown and rejects missing, directory, URL, and HTML inputs', () => {
  const dir = createTempDir();
  const md = path.join(dir, 'article.md');
  fs.writeFileSync(md, '# Answer\nUseful content.');
  assert.equal(validateWatchFile(md), md);
  for (const input of [dir, path.join(dir, 'missing.md'), 'https://example.com/a.md']) assert.throws(() => validateWatchFile(input));
  const html = path.join(dir, 'article.html'); fs.writeFileSync(html, '<p>x</p>');
  assert.throws(() => validateWatchFile(html), /Unsupported/);
  const originalStat = fs.statSync;
  fs.statSync = (() => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); }) as typeof fs.statSync;
  try { assert.throws(() => validateWatchFile(md), /Permission denied/); }
  finally { fs.statSync = originalStat; }
});

test('stable reader hashes content without modifying the watched file', async () => {
  const dir = createTempDir(); const file = path.join(dir, 'watch.mdx');
  fs.writeFileSync(file, '# One');
  const first = await readStableFile(file); const second = await readStableFile(file);
  assert.equal(first.hash, second.hash); assert.equal(first.content, '# One');
  assert.equal(fs.readFileSync(file, 'utf8'), '# One');
  const originalStat = fs.promises.stat; const originalRead = fs.promises.readFile; let calls = 0;
  fs.promises.stat = (async () => ({ size: calls++ ? 2 : 1, mtimeMs: 1 })) as typeof fs.promises.stat;
  fs.promises.readFile = (async () => 'x') as typeof fs.promises.readFile;
  try { await assert.rejects(() => readStableFile(file), (error: NodeJS.ErrnoException) => error.code === 'ECHANGED'); }
  finally { fs.promises.stat = originalStat; fs.promises.readFile = originalRead; }
});

test('watcher filters sibling events and forwards watcher errors', () => {
  const original = fs.watch; let listener!: (event: string, name: string | null) => void; let changes = 0; let reported = '';
  const emitter = new EventEmitter() as EventEmitter & { close(): void }; emitter.close = () => {};
  fs.watch = ((directory: fs.PathLike, callback: (event: string, name: string | null) => void) => {
    assert.equal(directory, '/tmp/docs'); listener = callback; return emitter;
  }) as typeof fs.watch;
  try {
    const watcher = watchFile('/tmp/docs/article.md', () => { changes++; }, (error) => { reported = error.message; });
    listener('change', 'other.md'); listener('rename', 'article.md'); listener('rename', null);
    emitter.emit('error', new Error('watch failed')); watcher.close();
    assert.equal(changes, 2); assert.equal(reported, 'watch failed');
  } finally { fs.watch = original; }
});

test('audit adapter creates all live scores and deterministic recommendations', async () => {
  const snapshot = await auditMarkdown('/private/article.md', '# What is it?\nIt is a concise answer.');
  assert.equal(typeof snapshot.scores.citationReadiness, 'number');
  assert.ok(snapshot.scores.composite >= 0 && snapshot.scores.composite <= 100);
  assert.ok(snapshot.scores.aeo >= 0 && snapshot.scores.aeo <= 100);
  assert.ok(snapshot.scores.geo >= 0 && snapshot.scores.geo <= 100);
  assert.ok(snapshot.scores.citationReadiness >= 0 && snapshot.scores.citationReadiness <= 100);
  assert.equal(snapshot.passedChecks + snapshot.warningChecks + snapshot.failedChecks, 12);
  assert.ok(snapshot.issues.every((issue) => issue.id.length > 0));
  assert.ok(snapshot.issues.every((issue) => issue.title.length > 0));
  assert.ok(snapshot.issues.every((issue) => issue.evidence.length > 0));
  assert.ok(snapshot.issues.every((issue) => issue.recommendation.length > 0));
  assert.deepEqual(snapshot.issues, [...snapshot.issues].sort(compareIssues));
  assert.equal(scoreDelta(10), '—'); assert.equal(scoreDelta(14, 10), '+4'); assert.equal(scoreDelta(8, 10), '−2');
  await assert.rejects(() => auditMarkdown('/private/article.md', '   '), /empty/);
});

test('controller deduplicates hashes, queues overlap, and preserves successful state on failure', async () => {
  let audits = 0; let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const snapshots = () => ({ filePath: '/x.md', scores: { composite: 1, aeo: 2, geo: 3, citationReadiness: 4 }, issues: [], passedChecks: 12, warningChecks: 0, failedChecks: 0, auditedAt: new Date(0).toISOString() });
  const controller = new TuiController('/x.md', 0, () => {}, {
    read: async () => ({ content: 'x', hash: 'same' }),
    watch: (() => ({ close() {} })) as never,
    audit: async () => { audits++; if (audits === 1) await gate; return snapshots(); },
  });
  const first = controller.start(); await Promise.resolve();
  const second = controller.run(); release(); await first; await second;
  assert.equal(audits, 1);
  await controller.run(); assert.equal(audits, 1);
  const old = controller.state.snapshot;
  const failing = new TuiController('/x.md', 0, () => {}, { read: async () => { throw new Error('bad parse'); }, watch: (() => ({ close() {} })) as never, audit: async () => snapshots() });
  failing.state.snapshot = old; await failing.run();
  assert.equal(failing.state.snapshot, old); assert.equal(failing.state.stale, true);
  controller.close(); failing.close();
});

test('keyboard actions update navigation, filters, evidence, help, and exit', () => {
  const controller = new TuiController('/x.md', 0, () => {}, { audit: async () => { throw new Error(); } });
  controller.key('\t'); assert.equal(controller.state.focus, 1);
  controller.key('\u001b[Z'); assert.equal(controller.state.focus, 0);
  controller.key('\u001b[A'); controller.key('\u001b[B');
  controller.key('\r'); assert.equal(controller.state.expanded, true);
  controller.key('f'); assert.equal(controller.state.failuresOnly, true);
  controller.key('?'); assert.equal(controller.state.help, true);
  assert.equal(controller.key('q'), undefined); assert.equal(controller.state.help, false);
  assert.equal(controller.key('q'), 'exit');
});

test('controller schedules refreshes, supports forced reruns, and sanitizes local paths', async () => {
  let callback = () => {}; let cleared = false; let audits = 0;
  const snapshot = () => ({ filePath: '/x.md', scores: { composite: audits, aeo: 2, geo: 3, citationReadiness: 4 }, issues: [], passedChecks: 12, warningChecks: 0, failedChecks: 0, auditedAt: new Date(0).toISOString() });
  const controller = new TuiController('/x.md', 10, () => {}, {
    read: async () => ({ content: 'x', hash: 'one' }),
    watch: ((_file, change) => { callback = change; return { close() {} }; }) as never,
    setTimer: ((fn) => { callback = fn; return {} as NodeJS.Timeout; }),
    clearTimer: (() => { cleared = true; }),
    audit: async () => { audits++; return snapshot(); },
  });
  await controller.start(); callback(); controller.schedule(); assert.equal(cleared, true);
  await controller.run(true); assert.equal(audits, 2); controller.close();
  assert.equal(safeMessage(new Error('Cannot read /Users/person/private/article.md')), 'Cannot read [local path]');
  assert.equal(safeMessage('unknown'), 'Audit failed. Save the file to try again.');
  let retryScheduled = false;
  const temporary = new TuiController('/x.md', 10, () => {}, {
    read: async () => { throw Object.assign(new Error('changed'), { code: 'ECHANGED' }); },
    setTimer: ((() => { retryScheduled = true; return {} as NodeJS.Timeout; })),
    audit: async () => snapshot(),
  });
  await temporary.run(); assert.equal(temporary.state.status, 'file-error'); assert.equal(retryScheduled, true); temporary.close();
});

test('renderer handles loading, success, stale, expanded help, and narrow terminals', () => {
  const loading = renderDashboard({ status: 'loading', stale: false, selected: 0, expanded: false, failuresOnly: false, help: false, focus: 0 }, 80);
  assert.match(loading, /Running initial audit/);
  const state = {
    status: 'audit-error' as const, stale: true, selected: 0, expanded: true, failuresOnly: true, help: true, focus: 0,
    message: 'Try again', snapshot: {
      filePath: path.join(process.cwd(), 'article.md'), previousScores: { composite: 40, aeo: 30, geo: 50, citationReadiness: 0 },
      scores: { composite: 44, aeo: 30, geo: 48, citationReadiness: 0 },
      issues: [{ id: 'a', title: 'Add evidence', severity: 'high' as const, status: 'failed' as const, evidence: 'None found', recommendation: 'Add a source.', impact: 7 }],
      passedChecks: 8, warningChecks: 3, failedChecks: 1, auditedAt: new Date(0).toISOString(),
    },
  };
  const output = renderDashboard(state, 80);
  assert.match(output, /Showing last successful/); assert.match(output, /Evidence: None found/); assert.match(output, /Press \? or q/);
  assert.match(renderDashboard(state, 35), /Terminal too narrow/);
});

test('TUI command wrapper starts and cleans up without a terminal or real watcher', async () => {
  const dir = createTempDir(); const file = path.join(dir, 'article.md'); fs.writeFileSync(file, '# Local');
  let started = false; let closed = false;
  const state = { status: 'loading' as const, stale: false, selected: 0, expanded: false, failuresOnly: false, help: false, focus: 0 };
  const cleanup = await runTui(file, { debounce: 200, color: false, jsonDebug: false }, {
    interactive: false,
    createController: (_file, debounce, draw) => ({
      state, start: async () => { started = true; assert.equal(debounce, 200); draw(state); },
      close: () => { closed = true; }, key: () => undefined,
    }),
  });
  assert.equal(started, true); cleanup(); assert.equal(closed, true);
  const priorCwd = process.cwd(); process.chdir(dir);
  try {
    const debugCleanup = await runTui(file, { debounce: 1, color: false, jsonDebug: true }, {
      interactive: false,
      createController: (_file, _debounce, draw) => ({ state, start: async () => draw(state), close: () => {}, key: () => undefined }),
    });
    debugCleanup();
    const diagnostic = JSON.parse(fs.readFileSync(path.join(dir, 'answerlint-tui-debug.jsonl'), 'utf8'));
    assert.deepEqual(Object.keys(diagnostic).sort(), ['at', 'event']);
  } finally { process.chdir(priorCwd); }
  closed = false;
  await assert.rejects(() => runTui(file, { debounce: 200, color: false, jsonDebug: false }, {
    interactive: false,
    createController: () => ({ state, start: async () => { throw new Error('start failed'); }, close: () => { closed = true; }, key: () => undefined }),
  }), /start failed/);
  assert.equal(closed, true);
});
