import { NextRequest, NextResponse } from 'next/server';
import { access } from 'fs/promises';
import path from 'path';
import { ZipArchive } from 'archiver';
import { getProject, getSettings } from '@/lib/local/store';
import { readDesignFile, mimeTypeFor } from '@/lib/local/files';
import { renderBrandGuidelinesHTML, type GuidelinesAsset } from '@/lib/brand-guidelines-html';
import { slugify } from '@/lib/slug';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

// Bundles everything for a project into one download: every generated file
// exactly as it sits in the designs folder, plus a self-contained
// brand-guidelines.html (images inlined as base64, so it opens correctly
// without the app running) and the raw brand-identity.json.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);
    const settings = await getSettings();
    const projectDir = path.join(settings.outputDir, project.folder);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    let streamError: Error | null = null;
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('error', (err) => {
      streamError = err;
    });

    const dirExists = await access(projectDir)
      .then(() => true)
      .catch(() => false);
    if (dirExists) archive.directory(projectDir, false);

    if (project.brandIdentity) {
      archive.append(JSON.stringify(project.brandIdentity, null, 2), { name: 'brand-identity.json' });

      const guidelinesAssets: GuidelinesAsset[] = [];
      for (const asset of project.assets) {
        try {
          const buffer = await readDesignFile(asset.file);
          guidelinesAssets.push({
            type: asset.type,
            prompt: asset.prompt,
            url: `data:${mimeTypeFor(asset.file)};base64,${buffer.toString('base64')}`,
          });
        } catch {
          // Skip a file that's gone missing from disk rather than failing the whole export.
        }
      }
      const html = renderBrandGuidelinesHTML(project.brandIdentity, guidelinesAssets, { autoPrint: false });
      archive.append(html, { name: 'brand-guidelines.html' });
    }

    await archive.finalize();
    if (streamError) throw streamError;

    const buffer = Buffer.concat(chunks);
    const filename = `${slugify(project.name) || 'brand-kit'}.zip`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
