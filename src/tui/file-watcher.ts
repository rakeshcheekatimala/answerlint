import { createHash } from 'node:crypto';
import fs, { FSWatcher } from 'node:fs';
import path from 'node:path';

export function validateWatchFile(input: string): string {
  if (/^https?:\/\//i.test(input)) throw new Error('URLs are not supported. Choose one local .md or .mdx file.');
  const resolved = path.resolve(input);
  let stat: fs.Stats;
  try { stat = fs.statSync(resolved); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('File not found. Check the path and try again.');
    if ((error as NodeJS.ErrnoException).code === 'EACCES') throw new Error('Permission denied. Make the file readable and try again.');
    throw error;
  }
  if (stat.isDirectory()) throw new Error('Directories are not supported. Choose one .md or .mdx file.');
  if (!['.md', '.mdx'].includes(path.extname(resolved).toLowerCase())) {
    throw new Error('Unsupported file type. The playground accepts .md and .mdx files only.');
  }
  return resolved;
}

export async function readStableFile(filePath: string): Promise<{ content: string; hash: string }> {
  const before = await fs.promises.stat(filePath);
  const content = await fs.promises.readFile(filePath, 'utf8');
  const after = await fs.promises.stat(filePath);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
    throw Object.assign(new Error('File changed while it was being read.'), { code: 'ECHANGED' });
  }
  return { content, hash: createHash('sha256').update(content).digest('hex') };
}

export function watchFile(filePath: string, onChange: () => void, onError: (error: Error) => void): FSWatcher {
  const basename = path.basename(filePath);
  const watcher = fs.watch(path.dirname(filePath), (event, name) => {
    if (!name || name.toString() === basename) onChange();
  });
  watcher.on('error', onError);
  return watcher;
}
