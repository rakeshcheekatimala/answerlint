import fs from 'fs';
import { Report } from '../types/index.js';

export function generateSarifReport(reports: Report[], outputPath?: string): string {
  const rules = new Map<string, { id: string; name: string; shortDescription: { text: string } }>();
  const results = reports.flatMap((report) => report.audits
    .filter((audit) => audit.status !== 'pass')
    .map((audit) => {
      rules.set(audit.id, { id: audit.id, name: audit.title, shortDescription: { text: audit.title } });
      return {
        ruleId: audit.id,
        level: audit.status === 'fail' ? 'error' : 'warning',
        message: { text: audit.evidence },
        locations: [{ physicalLocation: { artifactLocation: { uri: report.url } } }],
        properties: { category: audit.category, score: audit.score, weight: audit.weight },
      };
    }));
  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{ tool: { driver: { name: 'AnswerLint', informationUri: 'https://useanswerlint.com', rules: [...rules.values()] } }, results }],
  };
  const json = JSON.stringify(sarif, null, 2);
  if (outputPath) fs.writeFileSync(outputPath, json, 'utf8');
  return json;
}
