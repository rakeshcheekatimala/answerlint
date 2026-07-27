import chalk from 'chalk';

const c = {
  cyan: chalk.cyan,
  green: chalk.green,
  blue: chalk.blue,
  yellow: chalk.yellow,
  magenta: chalk.magenta,
  dim: chalk.dim,
  bold: chalk.bold,
  white: chalk.white,
  lime: chalk.hex('#ccff00'),
  orange: chalk.hex('#ff5500'),
};

function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

function padInner(inner: string, width: number): string {
  const n = stripAnsi(inner).length;
  return n >= width ? inner : inner + ' '.repeat(width - n);
}

/** Terminal dashboard: what answerlint offers (aligned with README). */
export function runOverview(version: string): void {
  const W = 58;
  const indent = '  ';
  const line = (inner: string) =>
    indent + c.cyan('│') + padInner(inner, W) + c.cyan('│');
  const sep = indent + c.cyan('├' + '─'.repeat(W) + '┤');
  const boxTop = indent + c.cyan('╭' + '─'.repeat(W) + '╮');
  const boxBot = indent + c.cyan('╰' + '─'.repeat(W) + '╯');

  console.log('');
  console.log(
    c.cyan(
      [
        '   █████╗ ███╗   ██╗███████╗██╗    ██╗███████╗██████╗ ██╗     ██╗███╗   ██╗████████╗',
        '  ██╔══██╗████╗  ██║██╔════╝██║    ██║██╔════╝██╔══██╗██║     ██║████╗  ██║╚══██╔══╝',
        '  ███████║██╔██╗ ██║███████╗██║ █╗ ██║█████╗  ██████╔╝██║     ██║██╔██╗ ██║   ██║',
        '  ██╔══██║██║╚██╗██║╚════██║██║███╗██║██╔══╝  ██╔══██╗██║     ██║██║╚██╗██║   ██║',
        '  ██║  ██║██║ ╚████║███████║╚███╔███╔╝███████╗██║  ██║███████╗██║██║ ╚████║   ██║',
        '  ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝',
      ].join('\n')
    )
  );
  console.log('');
  console.log(
    c.dim('  ') +
      c.bold.white('answerlint') +
      c.dim(` v${version}  ·  `) +
      c.cyan('Lighthouse-style AEO & GEO audits')
  );
  console.log(
    c.dim(
      '  Score pages for Answer Engine + Generative Engine optimization · HTML, JSON, CSV'
    )
  );
  console.log('');

  console.log(c.bold.white('  How it works'));
  console.log(
    `  ${c.lime('① Add content')}  ${c.dim('──→')}  ${c.orange('② Inspect clarity + trust')}  ${c.dim('──→')}  ${c.lime('③ Fix and recheck')}`
  );
  console.log(
    c.dim('  URL · Markdown · folder · sitemap     12 deterministic checks      you keep editorial control')
  );
  console.log('');

  console.log(c.bold.white('  Start with your goal'));
  console.log(
    `  ${c.lime('Write clearly')}   ${c.white('answerlint tui --watch ./article.md')}`
  );
  console.log(
    `  ${c.lime('Check a page')}     ${c.white('answerlint audit --url "https://example.com/page" --output html')}`
  );
  console.log(
    `  ${c.lime('Review a library')} ${c.white('answerlint audit --dir ./docs --output csv')}`
  );
  console.log(
    `  ${c.lime('Protect a PR')}      ${c.white('answerlint diff --base-report base.json --head-report current.json --fail-on-regression')}`
  );
  console.log(
    c.dim('  AnswerLint recommends changes; it never rewrites source content automatically.')
  );
  console.log('');

  console.log(boxTop);
  console.log(line(` ${c.bold.white('✦')} ${c.cyan('answerlint capability dashboard')}`));
  console.log(sep);

  const padVal = (colored: string, target: number) => {
    const n = stripAnsi(colored).length;
    return n >= target ? colored : colored + ' '.repeat(target - n);
  };

  const stat = (label: string, value: string, color: typeof chalk.green) =>
    line(` ${padVal(color(value), 26)}  ${c.dim(label)}`);

  console.log(stat('automated checks', '12', c.green));
  console.log(stat('report formats', 'html · json · csv', c.blue));
  console.log(stat('input modes', 'url · file · dir · sitemap', c.yellow));
  console.log(stat('AI roadmap files', 'llms.txt · llms-full.txt', c.green));
  console.log(stat('CI exit codes', '0 · 1 · 2 · 3', c.magenta));
  console.log(boxBot);
  console.log('');

  console.log(c.bold.white('  What it does'));
  console.log(
    c.dim(
      '  Read-only fetch of public URLs (robots-aware) or local .md / .html, run heuristics,')
  );
  console.log(
    c.dim(
      '  emit composite + AEO + GEO scores, pass/fail detail, and prioritized recommendations.')
  );
  console.log('');

  console.log(c.bold.white('  Inputs & when to use them'));
  const bar = (pct: number, width = 28) => {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    return c.cyan('█'.repeat(filled)) + c.dim('░'.repeat(empty));
  };

  const row = (name: string, pct: number, note: string) => {
    const left = `  ${c.white(name.padEnd(14))} ${bar(pct)} `;
    console.log(left + c.dim(note));
  };

  row('--url', 100, 'single live page');
  row('--file', 85, 'offline markdown or HTML');
  row('--dir', 70, 'batch local content');
  row('--sitemap', 90, 'many URLs (robots unless --ignore-robots)');
  row('llms', 80, 'generate and lint AI roadmaps');
  console.log('');

  console.log(c.bold.white('  Outputs'));
  console.log(boxTop);
  console.log(
    line(` ${c.green('html')}${c.dim('  default · single-file visual report')}`)
  );
  console.log(
    line(` ${c.blue('json')}${c.dim('  automation, CI artifacts, tooling')}`)
  );
  console.log(
    line(
      ` ${c.yellow('csv')}${c.dim('  one row per URL · dir / sitemap batches')}`
    )
  );
  console.log(boxBot);
  console.log('');

  console.log(c.bold.white('  CI mode (exit semantics)'));
  console.log(
    `  ${c.green('0')}  ${c.dim('success · audit finished; with --ci, composite ≥ threshold')}`
  );
  console.log(
    `  ${c.yellow('1')}  ${c.dim('CI fail · --ci and composite below --threshold (default 70)')}`
  );
  console.log(
    `  ${c.magenta('2')}  ${c.dim('crawl / network error (e.g. sitemap 404, blocked fetch)')}`
  );
  console.log(
    `  ${chalk.red('3')}  ${c.dim('invalid input or config')}`
  );
  console.log('');

  console.log(c.bold.white('  Configuration'));
  console.log(
    c.dim(
      '  Optional `.answerlint.json` in project or home; override with `--config <path>`.'
    )
  );
  console.log(
    c.dim(
      '  Crawl tuning: `--depth`, `--rate` (req/s), `--ignore-robots`.'
    )
  );
  console.log('');

  console.log(
    c.yellow('  💡 ') +
      c.dim('Quick start: ') +
      c.cyan('answerlint audit --url "https://yoursite.com" --output html --output-path ./report.html')
  );
  console.log(
    c.dim(
      '     Local smoke:  answerlint audit --file ./README.md --output json'
    )
  );
  console.log('');
}
