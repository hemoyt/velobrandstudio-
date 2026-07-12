import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getProject, updateProject, type StoredAsset } from '@/lib/local/store';
import { saveDesignFile, fileUrl } from '@/lib/local/files';
import { errorResponse } from '@/lib/api-response';

// For user-provided assets (e.g. bringing your own logo) and editor saves,
// rather than AI-generated ones.
export async function POST(req: NextRequest) {
  try {
    const { projectId, dataUrl, type = 'logo', label } = await req.json();
    if (!projectId || !dataUrl) {
      return NextResponse.json({ error: 'projectId and dataUrl are required' }, { status: 400 });
    }

    const project = await getProject(projectId);
    const assetLabel = label ?? 'Uploaded asset';
    const file = await saveDesignFile(project, type, assetLabel, dataUrl);

    const asset: StoredAsset = {
      id: randomUUID(),
      type,
      prompt: assetLabel,
      originalPrompt: null,
      file,
      createdAt: new Date().toISOString(),
    };
    await updateProject(projectId, (p) => {
      p.assets.push(asset);
    });

    return NextResponse.json({
      url: fileUrl(file),
      asset: { id: asset.id, type: asset.type, prompt: asset.prompt, original_prompt: null },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
