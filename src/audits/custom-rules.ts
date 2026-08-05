import { AuditContext, AuditResult, CustomRule } from '../types/index.js';

export function auditCustomRules(ctx: AuditContext, rules: CustomRule[]): AuditResult[] {
  return rules.map((rule) => {
    const haystack = rule.caseSensitive ? ctx.text : ctx.text.toLocaleLowerCase();
    const needle = rule.caseSensitive ? rule.value : rule.value.toLocaleLowerCase();
    let passes = false;

    if (rule.type === 'required-term') passes = haystack.includes(needle);
    if (rule.type === 'forbidden-term') passes = !haystack.includes(needle);
    if (rule.type === 'required-link') {
      passes = ctx.$('a[href]').toArray().some((element) => {
        const href = ctx.$(element).attr('href') ?? '';
        return rule.caseSensitive ? href.includes(rule.value) : href.toLocaleLowerCase().includes(needle);
      });
    }

    return {
      id: `custom:${rule.id}`,
      category: rule.category ?? 'geo',
      title: rule.message ?? `Custom rule: ${rule.id}`,
      status: passes ? 'pass' : 'fail',
      weight: 1,
      score: passes ? 1 : 0,
      evidence: `${rule.type} assertion ${passes ? 'passed' : 'failed'} for ${JSON.stringify(rule.value)}.`,
    };
  });
}
