import fs from 'node:fs';
import path from 'node:path';

const outputPath = required('GITHUB_OUTPUT');
const reportPath = path.join(required('RUNNER_TEMP'), 'answerlint-diff.json');

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const base = readScores(report.base?.scores, 'base');
  const head = readScores(report.head?.scores, 'head');
  writeOutputs({
    report_valid: 'true',
    diff_gate_passed: report.ci?.passed === true ? 'true' : 'false',
    base_composite: base.composite,
    base_aeo: base.aeo,
    base_geo: base.geo,
    head_composite: head.composite,
    head_aeo: head.aeo,
    head_geo: head.geo,
  });
} catch (error) {
  console.error(`Unable to export AnswerLint scores: ${(error).message}`);
  writeOutputs({
    report_valid: 'false',
    diff_gate_passed: 'false',
    base_composite: 0,
    base_aeo: 0,
    base_geo: 0,
    head_composite: 0,
    head_aeo: 0,
    head_geo: 0,
  });
}

function readScores(value, label) {
  if (!value || typeof value !== 'object') throw new Error(`Missing ${label} scores in diff report.`);
  return {
    composite: boundedScore(value.composite, `${label} composite`),
    aeo: boundedScore(value.aeo, `${label} AEO`),
    geo: boundedScore(value.geo, `${label} GEO`),
  };
}

function boundedScore(value, label) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error(`${label} score must be between 0 and 100.`);
  return score;
}

function writeOutputs(outputs) {
  const lines = Object.entries(outputs).map(([name, value]) => `${name}=${value}`).join('\n');
  fs.appendFileSync(outputPath, `${lines}\n`, 'utf8');
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
