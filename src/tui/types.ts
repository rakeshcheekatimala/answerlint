export type LiveScores = {
  composite: number;
  aeo: number;
  geo: number;
  citationReadiness: number;
};

export type LiveIssue = {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  status: 'warning' | 'failed';
  evidence: string;
  recommendation: string;
  line?: number;
  impact?: number;
};

export type LiveAuditSnapshot = {
  filePath: string;
  scores: LiveScores;
  previousScores?: LiveScores;
  issues: LiveIssue[];
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  auditedAt: string;
};

export type TuiState = {
  status: 'loading' | 'success' | 'file-error' | 'audit-error';
  snapshot?: LiveAuditSnapshot;
  message?: string;
  stale: boolean;
  selected: number;
  expanded: boolean;
  failuresOnly: boolean;
  help: boolean;
  focus: number;
};
