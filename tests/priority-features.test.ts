import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../.test-dist/config/index.js';
import { runAudits } from '../.test-dist/audits/runner.js';
import { mapWithConcurrency } from '../.test-dist/crawler/index.js';
import { generateSarifReport } from '../.test-dist/reporters/sarif.js';
import { buildBatchReport } from '../.test-dist/cli/commands/audit.js';
import type { Report } from '../src/types/index.js';

test('custom rules load from .answerlintrc-compatible JSON and produce audit results', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'answerlint-rules-'));
  const configPath = path.join(directory, '.answerlintrc.json');
  fs.writeFileSync(configPath, JSON.stringify({ rules: [
    { id: 'brand-name', type: 'required-term', value: 'AnswerLint', category: 'aeo' },
    { id: 'source-link', type: 'required-link', value: 'doi.org' },
  ] }));
  const config = loadConfig(configPath);
  const results = runAudits({
    url: 'file:///article.md',
    html: '<main><p>AnswerLint is documented.</p><a href="https://doi.org/10.1/example">Study</a></main>',
  }, config);
  assert.equal(results.find((audit) => audit.id === 'custom:brand-name')?.status, 'pass');
  assert.equal(results.find((audit) => audit.id === 'custom:source-link')?.status, 'pass');
});

test('entity relationship density recognizes verifiable knowledge graph links', () => {
  const config = loadConfig();
  const results = runAudits({
    url: 'https://example.com',
    html: '<main><p>OpenAI works with Microsoft.</p><a href="https://www.wikidata.org/wiki/Q24283660">OpenAI</a><a href="https://en.wikipedia.org/wiki/Microsoft">Microsoft</a></main>',
  }, config);
  assert.equal(results.find((audit) => audit.id === 'entity_relationship_density')?.status, 'pass');
});

test('worker pool preserves order and never exceeds its concurrency limit', async () => {
  let active = 0;
  let peak = 0;
  const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });
  assert.deepEqual(results, [2, 4, 6, 8, 10]);
  assert.equal(peak, 2);
  await assert.rejects(() => mapWithConcurrency([1], 0, async (value) => value), /positive integer/);
});

test('batch JSON contract is exhaustive and SARIF emits non-passing findings', () => {
  const makeReport = (url: string, composite: number): Report => ({
    url,
    timestamp: '2026-08-06T00:00:00.000Z',
    scores: { composite, aeo: composite, geo: composite, band: 'good', percentile: null },
    audits: [{ id: 'citation', category: 'geo', title: 'Citation', status: 'fail', weight: 1, score: 0, evidence: 'Missing citation.' }],
    probe: { enabled: false, results: [] },
  });
  const reports = [makeReport('https://example.com/a', 80), makeReport('https://example.com/b', 60)];
  const batch = buildBatchReport(reports);
  assert.equal(batch.reports.length, 2);
  assert.equal(batch.summary.average.composite, 70);
  assert.equal(batch.summary.minimum.url, 'https://example.com/b');
  const sarif = JSON.parse(generateSarifReport(reports));
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 2);
});
