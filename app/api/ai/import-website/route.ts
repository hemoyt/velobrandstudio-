import { NextRequest, NextResponse } from 'next/server';
import { requireProjectRole } from '@/lib/authz';
import { getGeminiProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { errorResponse } from '@/lib/api-response';
import { fetchWebsiteText } from '@/lib/website-import';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { projectId, url } = await req.json();
    if (!projectId || !url) {
      return NextResponse.json({ error: 'projectId and url are required' }, { status: 400 });
    }

    // Requiring editor+ access here is also what keeps this fetch endpoint
    // from being an open SSRF proxy for anyone who isn't already a
    // trusted team member — see lib/website-import.ts for the rest of the
    // guardrails.
    const { teamId } = await requireProjectRole(projectId, 'editor');

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

    const provider = await getGeminiProvider(teamId);
    if (!provider.describeFromWebsite) {
      throw new AIProviderError('Website import is unavailable', 422);
    }

    const description = await provider.describeFromWebsite({ title, text, url });
    return NextResponse.json({ description });
  } catch (err) {
    return errorResponse(err);
  }
}
