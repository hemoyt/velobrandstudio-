import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { slugify, randomSuffix } from '@/lib/slug';
import { getSettings, type StoredProject } from './store';

// Where each asset type lands inside the project's folder, so the designs
// directory the user browses is organized like a real studio hand-off.
const SUBDIR_BY_TYPE: Record<string, string> = {
  logo: 'logos',
  mockup: 'mockups',
  business_card: 'business-cards',
  social_template: 'social-templates',
  social_post: 'social-posts',
  video: 'videos',
};

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; extension: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Expected a base64 data URL');
  const extension = match[1].split('/')[1]?.split('+')[0] || 'bin';
  return { buffer: Buffer.from(match[2], 'base64'), extension };
}

/**
 * Writes a generated asset into the user's designs folder and returns its
 * path relative to that folder (which is what project records store).
 */
export async function saveDesignFile(
  project: StoredProject,
  type: string,
  label: string,
  dataUrl: string,
): Promise<string> {
  const { outputDir } = await getSettings();
  const { buffer, extension } = dataUrlToBuffer(dataUrl);
  const subdir = SUBDIR_BY_TYPE[type] ?? 'assets';
  const name = `${slugify(label) || type}-${randomSuffix()}.${extension}`;
  const relative = path.join(project.folder, subdir, name);

  const fullPath = path.join(outputDir, relative);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return relative.split(path.sep).join('/');
}

/** Browser-loadable URL for a stored design file. */
export function fileUrl(relativePath: string): string {
  return `/api/local-assets/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
}

/** Reads a design file, refusing any path that escapes the designs folder. */
export async function readDesignFile(relativePath: string): Promise<Buffer> {
  const { outputDir } = await getSettings();
  const root = path.resolve(outputDir);
  const fullPath = path.resolve(root, relativePath);
  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error('Invalid file path');
  }
  return readFile(fullPath);
}
