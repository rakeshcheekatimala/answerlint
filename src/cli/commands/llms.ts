import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { discoverLlmsSources } from '../../llms/discover.js';
import { buildLlmsDocument } from '../../llms/extract.js';
import { lintLlmsFile, lintLlmsText } from '../../llms/lint.js';
import { renderLlmsFullTxt, renderLlmsTxt } from '../../llms/render.js';
import { LlmsGenerateOptions, LlmsIssue, LlmsLintOptions } from '../../llms/types.js';
import { mapWithConcurrency } from '../../crawler/index.js';

type ResolvedLlmsGenerateOptions = LlmsGenerateOptions & { site: string };

export async function runLlmsGenerate(options: LlmsGenerateOptions): Promise<void> {
  const spinner = ora({ color: 'cyan' });

  try {
    const resolvedOptions = resolveGenerateOptions(options);
    validateGenerateOptions(resolvedOptions);

    spinner.start('Discovering content sources...');
    const sources = await discoverLlmsSources(resolvedOptions);
    spinner.succeed(`Discovered ${sources.length} source${sources.length === 1 ? '' : 's'}.`);

    if (sources.length === 0) {
      console.error(chalk.red('No supported content sources were found.'));
      process.exit(2);
    }

    spinner.start('Extracting deterministic page metadata...');
    const document = buildLlmsDocument(sources, resolvedOptions);
    spinner.succeed(`Prepared ${document.pages.length} llms.txt link${document.pages.length === 1 ? '' : 's'}.`);

    fs.mkdirSync(resolvedOptions.outDir, { recursive: true });

    const llmsTxt = renderLlmsTxt(document);
    const lint = lintLlmsText(llmsTxt, { strict: true, maxChars: 100_000 });
    if (!lint.valid) {
      printLintIssues(lint.issues);
      console.error(chalk.red('Generated llms.txt did not pass strict linting.'));
      process.exit(2);
    }

    const llmsPath = path.join(resolvedOptions.outDir, 'llms.txt');
    fs.writeFileSync(llmsPath, llmsTxt);
    console.log(chalk.green(`llms.txt saved to ${llmsPath}`));

    if (resolvedOptions.full) {
      const fullPath = path.join(resolvedOptions.outDir, 'llms-full.txt');
      fs.writeFileSync(fullPath, renderLlmsFullTxt(document, resolvedOptions.maxFullChars));
      console.log(chalk.green(`llms-full.txt saved to ${fullPath}`));
    }
  } catch (err) {
    spinner.fail(`llms generation failed: ${(err as Error).message}`);
    process.exit(2);
  }
}

export async function runLlmsLint(options: LlmsLintOptions): Promise<void> {
  const result = lintLlmsFile(options.file, {
    strict: options.strict,
    maxChars: options.maxChars,
  });

  if (result.valid && options.checkLinks) {
    const liveIssues = await validateLiveManifestLinks(options);
    result.issues.push(...liveIssues);
    result.errorCount += liveIssues.filter((issue) => issue.severity === 'error').length;
    result.warningCount += liveIssues.filter((issue) => issue.severity === 'warn').length;
    result.valid = result.errorCount === 0 && (!options.strict || result.warningCount === 0);
  }

  printLintIssues(result.issues);

  if (result.valid) {
    console.log(
      chalk.green(
        `llms.txt lint passed (${result.errorCount} errors, ${result.warningCount} warnings).`
      )
    );
    return;
  }

  console.error(
    chalk.red(
      `llms.txt lint failed (${result.errorCount} errors, ${result.warningCount} warnings).`
    )
  );

  if (options.ci || options.strict) {
    process.exit(1);
  }
}

async function validateLiveManifestLinks(options: LlmsLintOptions): Promise<LlmsIssue[]> {
  const content = fs.readFileSync(options.file, 'utf8');
  const markdownLinks = [...content.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
  const sourceLinks = [...content.matchAll(/^Source:\s*(https?:\/\/\S+)\s*$/gm)].map((match) => match[1]);
  const links = [...markdownLinks, ...sourceLinks];
  const timeoutMs = options.timeoutMs ?? 10_000;
  const checked = await mapWithConcurrency([...new Set(links)], options.concurrency ?? 4, async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      }
      if (!response.ok) return { severity: 'error' as const, message: `Live URL returned HTTP ${response.status}: ${url}` };
      if (response.redirected) return { severity: 'warn' as const, message: `Live URL redirects to ${response.url}: ${url}` };
      return undefined;
    } catch (error) {
      return { severity: 'error' as const, message: `Could not reach live URL (${(error as Error).message}): ${url}` };
    } finally {
      clearTimeout(timeout);
    }
  });
  return checked.filter((issue): issue is LlmsIssue => issue !== undefined);
}

function resolveGenerateOptions(options: LlmsGenerateOptions): ResolvedLlmsGenerateOptions {
  const site = options.site ?? inferSiteFromInput(options);
  if (!site) {
    throw new Error('--site is required when generating from a local directory.');
  }

  return { ...options, site };
}

function inferSiteFromInput(options: LlmsGenerateOptions): string | undefined {
  const input = options.url ?? options.sitemap;
  if (!input) return undefined;

  try {
    return new URL(input).origin;
  } catch {
    return undefined;
  }
}

function validateGenerateOptions(options: ResolvedLlmsGenerateOptions): void {
  const inputCount = [options.dir, options.url, options.sitemap].filter(Boolean).length;

  if (inputCount !== 1) {
    throw new Error('Provide exactly one input with --dir, --url, or --sitemap.');
  }

  try {
    const site = new URL(options.site);
    if (site.protocol !== 'http:' && site.protocol !== 'https:') {
      throw new Error();
    }
  } catch {
    throw new Error('--site must be an absolute http(s) URL.');
  }

  if (!Number.isFinite(options.maxLinks) || options.maxLinks < 1) {
    throw new Error('--max-links must be greater than 0.');
  }

  if (!Number.isFinite(options.maxFullChars) || options.maxFullChars < 1) {
    throw new Error('--max-full-chars must be greater than 0.');
  }
}

function printLintIssues(issues: LlmsIssue[]): void {
  for (const issue of issues) {
    const label = issue.severity === 'error' ? chalk.red('error') : chalk.yellow('warn');
    const location = issue.line ? `:${issue.line}` : '';
    const message = `llms.txt${location} ${label} ${issue.message}`;

    if (issue.severity === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
}
