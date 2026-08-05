import fs from 'fs';
import path from 'path';
import { AnswerlintConfig, DEFAULT_WEIGHTS } from '../types/index.js';

const DEFAULT_CONFIG: AnswerlintConfig = {
  audit: {
    aeo_weight: 0.5,
    geo_weight: 0.5,
    custom_weights: { ...DEFAULT_WEIGHTS },
  },
  probe: {
    enabled: false,
    models: ['gpt4o', 'claude'],
    cache_ttl_days: 7,
  },
  ci: {
    threshold: 70,
    fail_on_drop: true,
  },
  rules: [],
};

export function loadConfig(configPath?: string): AnswerlintConfig {
  const searchPaths = [
    configPath,
    path.join(process.cwd(), '.answerlintrc.json'),
    path.join(process.cwd(), '.answerlint.json'),
    path.join(process.env.HOME ?? '', '.answerlint.json'),
  ].filter(Boolean) as string[];

  let fileConfig: Partial<AnswerlintConfig> = {};

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        fileConfig = JSON.parse(raw) as Partial<AnswerlintConfig>;
        validateConfig(fileConfig, p);
        break;
      } catch {
        throw new Error(`Invalid JSON in config file: ${p}`);
      }
    }
  }

  return mergeConfig(DEFAULT_CONFIG, fileConfig);
}

function mergeConfig(
  defaults: AnswerlintConfig,
  override: Partial<AnswerlintConfig>
): AnswerlintConfig {
  return {
    audit: {
      aeo_weight: override.audit?.aeo_weight ?? defaults.audit.aeo_weight,
      geo_weight: override.audit?.geo_weight ?? defaults.audit.geo_weight,
      custom_weights: {
        ...defaults.audit.custom_weights,
        ...(override.audit?.custom_weights ?? {}),
      },
    },
    probe: {
      enabled: override.probe?.enabled ?? defaults.probe.enabled,
      models: override.probe?.models ?? defaults.probe.models,
      cache_ttl_days:
        override.probe?.cache_ttl_days ?? defaults.probe.cache_ttl_days,
    },
    ci: {
      threshold: override.ci?.threshold ?? defaults.ci.threshold,
      fail_on_drop: override.ci?.fail_on_drop ?? defaults.ci.fail_on_drop,
    },
    rules: override.rules ?? defaults.rules,
  };
}

function validateConfig(config: Partial<AnswerlintConfig>, source: string): void {
  if (config.rules !== undefined && !Array.isArray(config.rules)) {
    throw new Error(`Invalid rules in config file: ${source}`);
  }
  const ids = new Set<string>();
  for (const rule of config.rules ?? []) {
    if (!rule || typeof rule.id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/i.test(rule.id)) {
      throw new Error(`Custom rules require a stable alphanumeric id in config file: ${source}`);
    }
    if (ids.has(rule.id)) throw new Error(`Duplicate custom rule id "${rule.id}" in config file: ${source}`);
    ids.add(rule.id);
    if (!['required-term', 'forbidden-term', 'required-link'].includes(rule.type)) {
      throw new Error(`Unsupported custom rule type for "${rule.id}" in config file: ${source}`);
    }
    if (typeof rule.value !== 'string' || rule.value.trim() === '') {
      throw new Error(`Custom rule "${rule.id}" requires a non-empty value.`);
    }
  }
}

export function getWeight(
  config: AnswerlintConfig,
  auditId: string
): number {
  return (
    config.audit.custom_weights[auditId] ??
    DEFAULT_WEIGHTS[auditId] ??
    1.0
  );
}
