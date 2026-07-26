import { AuditResult } from '../types/index.js';

export const CITATION_READINESS_AUDIT_IDS = [
  'citation_likelihood',
  'external_links',
  'trust_signals',
] as const;

/** Deterministic citation-readiness score shared by live and diff reports. */
export function computeCitationReadiness(audits: AuditResult[]): number {
  const selected = CITATION_READINESS_AUDIT_IDS
    .map((id) => audits.find((audit) => audit.id === id))
    .filter((audit): audit is AuditResult => Boolean(audit));
  if (selected.length === 0) return 0;
  const totalWeight = selected.reduce((sum, audit) => sum + audit.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(
    (selected.reduce((sum, audit) => sum + audit.score * audit.weight, 0) /
      totalWeight) *
      100
  );
}
