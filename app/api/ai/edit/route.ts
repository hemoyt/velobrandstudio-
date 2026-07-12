import { NextRequest, NextResponse } from 'next/server';
import { getImageProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

// Intentionally does not persist to disk: the ImageEditor calls this for
// every iterative edit (smart erase, freeform AI edit) and keeps its own local
// undo history. Only the final composited image gets saved, when the user
// explicitly saves — see the upload route.
export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();
    if (!image || !prompt) {
      return NextResponse.json({ error: 'image and prompt are required' }, { status: 400 });
    }

    const provider = await getImageProvider();
    if (!provider.editImage) {
      throw new AIProviderError('The configured provider does not support image editing', 422);
    }

    const url = await provider.editImage({ image, prompt });
    return NextResponse.json({ url });
  } catch (err) {
    return errorResponse(err);
  }
}
