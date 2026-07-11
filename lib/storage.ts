import { randomUUID } from 'crypto';
import type { createClient } from '@/lib/supabase/server';

const BUCKET = 'assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
 * the RLS-scoped client, so this fails unless they have editor+ access —
 * see supabase/migrations for the matching storage.objects policies.
 */
export async function uploadGeneratedAsset(
  supabase: SupabaseServerClient,
  teamId: string,
  projectId: string,
  dataUrl: string,
): Promise<{ path: string; signedUrl: string }> {
  const { buffer, mimeType, extension } = dataUrlToBuffer(dataUrl);
  const path = `${teamId}/${projectId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  return { path, signedUrl: await getSignedUrl(supabase, path) };
}

export async function getSignedUrl(supabase: SupabaseServerClient, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedUrls(supabase: SupabaseServerClient, paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  const map: Record<string, string> = {};
  data.forEach((entry, i) => {
    if (entry.signedUrl) map[paths[i]] = entry.signedUrl;
  });
  return map;
}
