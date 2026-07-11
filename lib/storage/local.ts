import { createHmac, timingSafeEqual } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

// Default storage backend for local/self-hosted runs: generated assets are
// written straight to disk under this folder instead of Supabase Storage.
// Override with LOCAL_STORAGE_DIR. Deliberately named "design" per the
// product ask — it's what you'll see sitting next to the repo after
// `npm run dev` and generating a brand kit.
export const LOCAL_STORAGE_ROOT = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'design');

const TTL_SECONDS = 60 * 60;

function signingSecret(): string {
  // Reuses ENCRYPTION_KEY so there's nothing new to configure. Falls back to
  // a fixed dev secret ONLY so `npm run dev` works before you've set
  // ENCRYPTION_KEY — never rely on that fallback in a deployed environment.
  return process.env.ENCRYPTION_KEY || 'dev-only-insecure-secret-set-ENCRYPTION_KEY';
}

function sign(storagePath: string, expires: number): string {
  return createHmac('sha256', signingSecret()).update(`${storagePath}:${expires}`).digest('base64url');
}

export async function localUpload(storagePath: string, buffer: Buffer): Promise<void> {
  const fullPath = path.join(LOCAL_STORAGE_ROOT, storagePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
}

export async function localRead(storagePath: string): Promise<Buffer> {
  const fullPath = path.resolve(path.join(LOCAL_STORAGE_ROOT, storagePath));
  const root = path.resolve(LOCAL_STORAGE_ROOT);
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error('Invalid storage path');
  }
  return readFile(fullPath);
}

/**
 * Same trust model as Supabase's own createSignedUrl: whoever holds this URL
 * can fetch the file until it expires, no session required. That's already
 * how the public share page works against Supabase Storage, so this doesn't
 * introduce a new class of access — it just serves from disk instead.
 */
export function localSignedUrl(storagePath: string): string {
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const sig = sign(storagePath, expires);
  return `/api/local-assets/${storagePath}?expires=${expires}&sig=${sig}`;
}

export function verifyLocalSignature(storagePath: string, expires: string | null, sig: string | null): boolean {
  if (!expires || !sig) return false;
  if (Math.floor(Date.now() / 1000) > Number(expires)) return false;
  const expected = sign(storagePath, Number(expires));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
