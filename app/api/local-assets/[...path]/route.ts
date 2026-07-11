import { NextRequest, NextResponse } from 'next/server';
import { localRead, verifyLocalSignature } from '@/lib/storage/local';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// Serves files written by the local storage backend (lib/storage/local.ts).
// Authorization is the HMAC signature + expiry in the query string, generated
// only after the caller already passed lib/authz.ts — not a session check
// here, same trust model as a Supabase signed URL.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.length === 0 || segments.some((s) => s === '..' || s === '.' || s.includes('/'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const storagePath = segments.join('/');
  const { searchParams } = req.nextUrl;
  const valid = verifyLocalSignature(storagePath, searchParams.get('expires'), searchParams.get('sig'));
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 403 });
  }

  try {
    const buffer = await localRead(storagePath);
    const ext = storagePath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
