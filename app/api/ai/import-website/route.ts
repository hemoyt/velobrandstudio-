import { NextRequest, NextResponse } from 'next/server';
import { getTextProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';
import { fetchWebsiteText } from '@/lib/website-import';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // This is a single-user local tool, so the fetch runs with the same
    // network access the user already has. lib/website-import.ts still
    // blocks localhost/private ranges as a guardrail against accidents.
    let title = '';
    let text = '';
    try {
      ({ title, text } = await fetchWebsiteText(url));
    } catch (err) {
      throw new AIProviderError(err instanceof Error ? err.message : 'Could not fetch that URL', 400);
    }
    if (!text) {
      throw new AIProviderError('Could not extract readable content from that page', 422);
    }

    const provider = await getTextProvider();
    if (!provider.describeFromWebsite) {
      throw new AIProviderError('Website import is unavailable', 422);
    }

    const description = await provider.describeFromWebsite({ title, text, url });
    return NextResponse.json({ description });
  } catch (err) {
    return errorResponse(err);
  }
}
