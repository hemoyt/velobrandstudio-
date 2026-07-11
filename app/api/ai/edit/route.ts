import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { getImageProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

// Intentionally does not persist to storage/DB: the ImageEditor calls this for
// every iterative edit (smart erase, freeform AI edit) and keeps its own local
// undo history. Only the final composited image gets uploaded, when the user
// explicitly saves — see the project asset routes.
export async function POST(req: NextRequest) {
  try {
    const { projectId, image, prompt } = await req.json();
    if (!projectId || !image || !prompt) {
      return NextResponse.json({ error: 'projectId, image, and prompt are required' }, { status: 400 });
    }

    const { teamId } = await requireProjectRole(projectId, 'editor');
    const provider = await getImageProvider(teamId);
    if (!provider.editImage) {
      throw new AIProviderError('The configured provider does not support image editing', 422);
    }

    const url = await provider.editImage({ image, prompt });
    return NextResponse.json({ url });
  } catch (err) {
    return errorResponse(err);
  }
}
