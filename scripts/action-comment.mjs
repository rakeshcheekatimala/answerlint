import fs from 'node:fs';

const marker = '<!-- answerlint-score-delta -->';
const report = JSON.parse(fs.readFileSync(required('DIFF_REPORT'), 'utf8'));
const floors = {
  composite: numberEnv('MIN_COMPOSITE_SCORE'),
  aeo: numberEnv('MIN_AEO_SCORE'),
  geo: numberEnv('MIN_GEO_SCORE'),
};
const scores = {
  base: readScores(report.base?.scores, 'base'),
  head: readScores(report.head?.scores, 'head'),
};
const failures = report.ci?.passed === false
  ? ['A configured score-delta gate failed. Review the workflow log for details.']
  : [];
for (const [key, floor] of Object.entries(floors)) {
  const score = scores.head[key];
  if (score < floor) failures.push(`${key.toUpperCase()} score ${score} is below ${floor}.`);
}
if (process.env.DIFF_EXIT !== '0' && failures.length === 0) failures.push('AnswerLint diff command failed.');

const rows = ['composite', 'aeo', 'geo'].map((key) => {
  const base = scores.base[key];
  const head = scores.head[key];
  const delta = head - base;
  return `| ${key.toUpperCase()} | ${base} | ${head} | ${delta > 0 ? '+' : ''}${delta} | ${floors[key]} |`;
});
const body = [
  marker,
  '## AnswerLint AEO/GEO score delta',
  '',
  '| Score | Base | PR | Delta | Minimum |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...rows,
  '',
  failures.length === 0 ? '✅ Merge gate passed.' : `❌ Merge gate failed:\n${failures.map((reason) => `- ${reason}`).join('\n')}`,
].join('\n');

if (process.env.GITHUB_EVENT_NAME === 'pull_request' || process.env.GITHUB_EVENT_NAME === 'pull_request_target') {
  await upsertComment(body);
} else {
  console.log(body);
}
if (failures.length > 0) process.exitCode = 1;

async function upsertComment(body) {
  const issue = positiveIntegerEnv('PR_NUMBER');
  const [owner, repo] = repositoryEnv();
  const root = `https://api.github.com/repos/${owner}/${repo}/issues/${issue}/comments`;
  const headers = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${required('GITHUB_TOKEN')}`,
    'x-github-api-version': '2022-11-28',
    'user-agent': 'answerlint-action',
  };
  const response = await fetch(root, { headers });
  if (!response.ok) throw new Error(`Unable to list PR comments: HTTP ${response.status}`);
  const comments = await response.json();
  const existing = comments.find((comment) => comment.body?.includes(marker));
  const commentId = existing ? positiveInteger(existing.id, 'GitHub comment id') : undefined;
  const target = commentId ? `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}` : root;
  const write = await fetch(target, { method: existing ? 'PATCH' : 'POST', headers, body: JSON.stringify({ body }) });
  if (!write.ok) throw new Error(`Unable to publish PR comment: HTTP ${write.status}`);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function numberEnv(name) {
  const value = Number(required(name));
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${name} must be between 0 and 100.`);
  return value;
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

function positiveIntegerEnv(name) {
  return positiveInteger(required(name), name);
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function repositoryEnv() {
  const repository = required('GITHUB_REPOSITORY');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('GITHUB_REPOSITORY must contain a valid owner/repository pair.');
  }
  return repository.split('/');
}
