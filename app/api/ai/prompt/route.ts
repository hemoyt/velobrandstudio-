import { NextRequest, NextResponse } from 'next/server';
import { getTextProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 30;

type PromptKind = 'optimize-logo-prompt' | 'enhance-description' | 'optimize-video-prompt';

export async function POST(req: NextRequest) {
  try {
    const { kind, text, style } = (await req.json()) as {
      kind?: PromptKind;
      text?: string;
      style?: string;
    };
    if (!kind || !text) {
      return NextResponse.json({ error: 'kind and text are required' }, { status: 400 });
    }

    const provider = await getTextProvider();

    let result: string;
    switch (kind) {
      case 'optimize-logo-prompt':
        if (!provider.optimizeLogoPrompt) throw new AIProviderError('Unavailable', 422);
        result = await provider.optimizeLogoPrompt(text, style);
        break;
      case 'enhance-description':
        if (!provider.enhanceDescription) throw new AIProviderError('Unavailable', 422);
        result = await provider.enhanceDescription(text);
        break;
      case 'optimize-video-prompt':
        if (!provider.optimizeVideoPrompt) throw new AIProviderError('Unavailable', 422);
        result = await provider.optimizeVideoPrompt(text);
        break;
      default:
        return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });
    }

    return NextResponse.json({ text: result });
  } catch (err) {
    return errorResponse(err);
  }
}
