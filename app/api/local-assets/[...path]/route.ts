import { NextRequest, NextResponse } from 'next/server';
import { readDesignFile } from '@/lib/local/files';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// Serves files from the user's designs folder. This is a single-user local
// tool with no auth — the only hard requirement is that a crafted URL can
// never read outside the designs folder, which readDesignFile enforces.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.length === 0 || segments.some((s) => s === '..' || s === '.' || s.includes('/') || s.includes('\\'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const relativePath = segments.map(decodeURIComponent).join('/');
  if (relativePath.split('/').some((s) => s === '..' || s === '.')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const buffer = await readDesignFile(relativePath);
    const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
