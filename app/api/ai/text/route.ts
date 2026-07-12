import { NextRequest, NextResponse } from 'next/server';
import { updateProject } from '@/lib/local/store';
import { getTextProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { projectId, description } = await req.json();
    if (!projectId || !description) {
      return NextResponse.json({ error: 'projectId and description are required' }, { status: 400 });
    }

    const provider = await getTextProvider();
    if (!provider.generateBrandText) {
      throw new AIProviderError('Brand text generation is unavailable', 422);
    }

    const identity = await provider.generateBrandText(description);
    await updateProject(projectId, (p) => {
      p.brandIdentity = identity;
    });

    return NextResponse.json(identity);
  } catch (err) {
    return errorResponse(err);
  }
}
