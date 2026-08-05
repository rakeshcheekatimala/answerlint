import { AuditContext, AuditResult } from '../../types/index.js';

const KNOWLEDGE_DOMAINS = ['wikidata.org', 'wikipedia.org'];

export function auditEntityRelationshipDensity(ctx: AuditContext): AuditResult {
  const root = ctx.$('main, article').first();
  const scope = root.length ? root : ctx.$('body');
  const text = scope.text().replace(/\s+/g, ' ').trim();
  const words = Math.max(1, text.split(/\s+/).length);
  const nodes = new Set<string>();

  scope.find('a[href]').each((_, element) => {
    const href = ctx.$(element).attr('href');
    if (!href) return;
    try {
      const url = new URL(href, ctx.url);
      const hostname = url.hostname.toLocaleLowerCase();
      if (KNOWLEDGE_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
        nodes.add(url.href.split('#')[0]);
      }
    } catch { /* malformed links are handled by link audits */ }
  });

  const density = Number(((nodes.size / words) * 1000).toFixed(2));
  const passes = nodes.size >= 2 && density >= 1;
  return {
    id: 'entity_relationship_density',
    category: 'geo',
    title: 'Entity relationship density',
    status: passes ? 'pass' : nodes.size > 0 ? 'warn' : 'fail',
    weight: 1.2,
    score: passes ? 1 : 0,
    evidence: `${nodes.size} verifiable Wikipedia/Wikidata node(s) in primary content (${density} per 1,000 words).`,
  };
}
