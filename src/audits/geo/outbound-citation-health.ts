import { AuditContext, AuditResult } from '../../types/index.js';
import { mapWithConcurrency } from '../../crawler/index.js';

const REPUTABLE_SUFFIXES = ['.gov', '.edu', '.ac.uk'];
const REPUTABLE_HOSTS = new Set(['wikipedia.org', 'wikidata.org', 'doi.org', 'github.com']);

export async function auditOutboundCitationHealth(ctx: AuditContext, concurrency = 4): Promise<AuditResult> {
  const origin = safeOrigin(ctx.url);
  const links = [...new Set(ctx.$('main a[href], article a[href], body a[href]').toArray()
    .map((element) => ctx.$(element).attr('href') ?? '')
    .filter((href) => /^https?:\/\//.test(href))
    .filter((href) => !origin || safeOrigin(href) !== origin))].slice(0, 20);

  if (links.length === 0) return result('fail', 0, 'No outbound citations were available to verify.');
  if (!origin) return result('warn', 0, `${links.length} outbound citation(s) found; live health checks require a URL audit.`);

  const checks = await mapWithConcurrency(links, concurrency, checkLink);
  const broken = checks.filter((check) => check.kind === 'broken');
  const redirected = checks.filter((check) => check.kind === 'redirect');
  const reputable = links.filter(isReputable).length;
  const healthy = broken.length === 0 && reputable > 0;
  return result(
    healthy ? (redirected.length > 0 ? 'warn' : 'pass') : 'fail',
    healthy ? 1 : 0,
    `${links.length} checked; ${broken.length} broken, ${redirected.length} redirecting, ${reputable} recognized authoritative-domain citation(s).${broken[0] ? ` Broken: ${broken[0].url}` : ''}`
  );
}

async function checkLink(url: string): Promise<{ url: string; kind: 'ok' | 'broken' | 'redirect' }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: 'GET', redirect: 'manual', signal: controller.signal });
    }
    if (response.status >= 300 && response.status < 400) return { url, kind: 'redirect' };
    if (!response.ok) return { url, kind: 'broken' };
    return { url, kind: 'ok' };
  } catch {
    return { url, kind: 'broken' };
  } finally {
    clearTimeout(timer);
  }
}

function isReputable(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLocaleLowerCase();
    return REPUTABLE_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
      [...REPUTABLE_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch { return false; }
}

function safeOrigin(value: string): string {
  try { return new URL(value).origin; } catch { return ''; }
}

function result(status: AuditResult['status'], score: number, evidence: string): AuditResult {
  return { id: 'outbound_citation_health', category: 'geo', title: 'Outbound citation health', status, weight: 1.2, score, evidence };
}
