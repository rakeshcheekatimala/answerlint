import { marked } from 'marked';
import { runAudits } from '../audits/runner.js';
import { loadConfig } from '../config/index.js';
import { generateRecommendations } from '../recommendations/index.js';
import { computeScores } from '../scoring/index.js';
import { computeCitationReadiness } from '../scoring/citation-readiness.js';
import { Priority } from '../types/index.js';
import { LiveAuditSnapshot, LiveIssue, LiveScores } from './types.js';

export async function auditMarkdown(
  filePath: string,
  content: string,
  previousScores?: LiveScores,
  now: () => Date = () => new Date()
): Promise<LiveAuditSnapshot> {
  if (!content.trim()) throw new Error('The file is empty. Add Markdown content and save it.');
  const html = await marked(content);
  const audits = generateRecommendations(runAudits({ url: 'local-document', html }));
  const scored = computeScores(audits, loadConfig());
  const issues: LiveIssue[] = audits
    .filter((audit) => audit.status !== 'pass')
    .map((audit): LiveIssue => ({
      id: audit.id,
      title: audit.title,
      severity: audit.recommendation?.priority ?? severity(audit.weight),
      status: audit.status === 'fail' ? 'failed' : 'warning',
      evidence: audit.evidence,
      recommendation: audit.recommendation?.instruction ?? `Improve ${audit.title.toLowerCase()}.`,
      impact: audit.recommendation?.score_impact ?? Math.round(audit.weight * 5),
    }))
    .sort(compareIssues);
  return {
    filePath,
    scores: {
      composite: scored.composite,
      aeo: scored.aeo,
      geo: scored.geo,
      citationReadiness: computeCitationReadiness(audits),
    },
    previousScores,
    issues,
    passedChecks: audits.filter((a) => a.status === 'pass').length,
    warningChecks: audits.filter((a) => a.status === 'warn').length,
    failedChecks: audits.filter((a) => a.status === 'fail').length,
    auditedAt: now().toISOString(),
  };
}

function severity(weight: number): Priority {
  return weight >= 1.3 ? 'high' : weight >= 1 ? 'medium' : 'low';
}

export function compareIssues(a: LiveIssue, b: LiveIssue): number {
  const status = { failed: 0, warning: 1 };
  const severityRank = { high: 0, medium: 1, low: 2 };
  return status[a.status] - status[b.status] ||
    severityRank[a.severity] - severityRank[b.severity] ||
    (b.impact ?? 0) - (a.impact ?? 0) || a.id.localeCompare(b.id);
}

export function scoreDelta(current: number, previous?: number): string {
  if (previous === undefined) return '—';
  const delta = current - previous;
  return delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : '0';
}
