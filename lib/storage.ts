import { randomUUID } from 'crypto';
import type { createClient } from '@/lib/supabase/server';
import { localUpload, localSignedUrl } from '@/lib/storage/local';

const BUCKET = 'assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Which storage backend generated assets are written to.
 * - 'local' (default): writes to a local `design/` folder — what you get
 *   out of the box running `npm run dev` or self-hosting. Not suitable for
 *   Vercel/serverless, where the filesystem isn't persistent, so this
 *   auto-switches to 'supabase' when the VERCEL env var is present.
 * - 'supabase': uses the Supabase Storage bucket + RLS policies from
 *   supabase/migrations. Required for serverless deploys; also fine locally
 *   if you'd rather keep everything in Supabase.
 * Override explicitly with STORAGE_BACKEND=local|supabase.
 */
function backend(): 'local' | 'supabase' {
  if (process.env.STORAGE_BACKEND === 'local' || process.env.STORAGE_BACKEND === 'supabase') {
    return process.env.STORAGE_BACKEND;
  }
  return process.env.VERCEL ? 'supabase' : 'local';
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string; extension: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Expected a base64 data URL');
  const mimeType = match[1];
  const extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
  return { buffer: Buffer.from(match[2], 'base64'), mimeType, extension };
}

/**
 * Uploads a generated asset (image or video, as a base64 data URL) to the
 * team/project-scoped storage path and returns the stored path plus a
 * short-lived signed URL for immediate display. Runs as the acting user via
 * the RLS-scoped client, so on the 'supabase' backend this fails unless they
 * have editor+ access — see supabase/migrations for the matching
 * storage.objects policies. The 'local' backend relies on the caller already
 * having gone through lib/authz.ts before reaching here.
 */
export async function uploadGeneratedAsset(
  supabase: SupabaseServerClient,
  teamId: string,
  projectId: string,
  dataUrl: string,
): Promise<{ path: string; signedUrl: string }> {
  const { buffer, mimeType, extension } = dataUrlToBuffer(dataUrl);
  const path = `${teamId}/${projectId}/${randomUUID()}.${extension}`;

  if (backend() === 'local') {
    await localUpload(path, buffer);
    return { path, signedUrl: localSignedUrl(path) };
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  return { path, signedUrl: await getSignedUrl(supabase, path) };
}

export async function getSignedUrl(supabase: SupabaseServerClient, path: string): Promise<string> {
  if (backend() === 'local') return localSignedUrl(path);

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedUrls(supabase: SupabaseServerClient, paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  if (backend() === 'local') {
    const map: Record<string, string> = {};
    paths.forEach((p) => (map[p] = localSignedUrl(p)));
    return map;
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  const map: Record<string, string> = {};
  data.forEach((entry, i) => {
    if (entry.signedUrl) map[paths[i]] = entry.signedUrl;
  });
  return map;
}
