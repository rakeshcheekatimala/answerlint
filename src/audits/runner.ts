import * as cheerio from 'cheerio';
import { AnswerlintConfig, AuditContext, AuditResult, PageContent } from '../types/index.js';
import { auditCustomRules } from './custom-rules.js';
import { auditEntityRelationshipDensity } from './geo/entity-relationship-density.js';
import { auditOutboundCitationHealth } from './geo/outbound-citation-health.js';

import { auditFaqSchema } from './aeo/faq-schema.js';
import { auditDirectAnswer } from './aeo/direct-answer.js';
import { auditQaDensity } from './aeo/qa-density.js';
import { auditReadability } from './aeo/readability.js';
import { auditNamedEntities } from './aeo/named-entities.js';
import { auditAuthorByline } from './aeo/author-byline.js';

import { auditTopicalDepth } from './geo/topical-depth.js';
import { auditTrustSignals } from './geo/trust-signals.js';
import { auditContentFreshness } from './geo/content-freshness.js';
import { auditExternalLinks } from './geo/external-links.js';
import { auditComparisonContent } from './geo/comparison-content.js';
import { auditCitationLikelihood } from './geo/citation-likelihood.js';

export function runAudits(page: PageContent, config?: AnswerlintConfig): AuditResult[] {
  const $ = cheerio.load(page.html);

  // Plain text for NLP/heuristics — clone so script/style stay in `$` for schema audits
  const textRoot = $('body').length ? $('body').clone() : $.root().clone();
  textRoot.find('script, style, noscript').remove();
  const text = textRoot.text().replace(/\s+/g, ' ').trim();

  const ctx: AuditContext = {
    url: page.url,
    html: page.html,
    text,
    $,
  };

  return [
    auditFaqSchema(ctx),
    auditDirectAnswer(ctx),
    auditQaDensity(ctx),
    auditReadability(ctx),
    auditNamedEntities(ctx),
    auditAuthorByline(ctx),
    auditTopicalDepth(ctx),
    auditTrustSignals(ctx),
    auditContentFreshness(ctx),
    auditExternalLinks(ctx),
    auditComparisonContent(ctx),
    auditCitationLikelihood(ctx),
    auditEntityRelationshipDensity(ctx),
    ...auditCustomRules(ctx, config?.rules ?? []),
  ];
}

export async function runNetworkAudits(page: PageContent, concurrency: number): Promise<AuditResult[]> {
  const $ = cheerio.load(page.html);
  const textRoot = $('body').length ? $('body').clone() : $.root().clone();
  textRoot.find('script, style, noscript').remove();
  const ctx: AuditContext = { url: page.url, html: page.html, text: textRoot.text().replace(/\s+/g, ' ').trim(), $ };
  return [await auditOutboundCitationHealth(ctx, concurrency)];
}
