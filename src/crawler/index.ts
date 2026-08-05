import { AuditOptions, PageContent } from '../types/index.js';
import { fetchUrl } from './url-fetcher.js';
import { parseLocalFile, parseLocalDir } from './local-parser.js';
import { fetchSitemapUrls } from './sitemap.js';
import { isAllowed } from './robots.js';

export async function crawl(options: AuditOptions): Promise<PageContent[]> {
  const rateMs = Math.round(1000 / (options.rate || 1));

  if (options.file) {
    return [await parseLocalFile(options.file)];
  }

  if (options.dir) {
    return parseLocalDir(options.dir);
  }

  if (options.sitemap) {
    const urls = await fetchSitemapUrls(options.sitemap);
    const pages = await mapWithConcurrency(urls, options.concurrency || 4, async (url) => {
      const allowed = await isAllowed(url, options.ignoreRobots);
      if (!allowed) return undefined;
      try {
        return await fetchUrl(url, { rateMs });
      } catch {
        return undefined;
      }
    });
    return pages.filter((page): page is PageContent => page !== undefined);
  }

  if (options.url) {
    const allowed = await isAllowed(options.url, options.ignoreRobots);
    if (!allowed) {
      throw new Error(
        `robots.txt disallows crawling ${options.url}. Use --ignore-robots to override.`
      );
    }
    const page = await fetchUrl(options.url, { rateMs });
    return [page];
  }

  throw new Error('No input provided. Use --url, --file, --dir, or --sitemap.');
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('Concurrency must be a positive integer.');
  }
  const results = new Array<R>(values.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await worker(values[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
