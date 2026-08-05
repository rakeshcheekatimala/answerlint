import fs from 'node:fs';

const marker = '<!-- answerlint-score-delta -->';
const report = JSON.parse(fs.readFileSync(required('DIFF_REPORT'), 'utf8'));
const floors = {
  composite: numberEnv('MIN_COMPOSITE_SCORE'),
  aeo: numberEnv('MIN_AEO_SCORE'),
  geo: numberEnv('MIN_GEO_SCORE'),
};
const failures = [...(report.ci?.reasons ?? [])];
for (const [key, floor] of Object.entries(floors)) {
  const score = report.head.scores[key];
  if (score < floor) failures.push(`${key.toUpperCase()} score ${score} is below ${floor}.`);
}
if (process.env.DIFF_EXIT !== '0' && failures.length === 0) failures.push('AnswerLint diff command failed.');

const rows = ['composite', 'aeo', 'geo'].map((key) => {
  const base = report.base.scores[key];
  const head = report.head.scores[key];
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
  const event = JSON.parse(fs.readFileSync(required('GITHUB_EVENT_PATH'), 'utf8'));
  const issue = event.pull_request?.number;
  if (!issue) throw new Error('Pull request number is missing from the GitHub event payload.');
  const [owner, repo] = required('GITHUB_REPOSITORY').split('/');
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
  const target = existing ? `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}` : root;
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
