import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/local/store';
import { verifyOpenAIKey } from '@/lib/providers/openai';
import { verifyGeminiKey } from '@/lib/providers/gemini';
import { verifyOpenRouterKey } from '@/lib/providers/openrouter';

export const maxDuration = 30;

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Verification failed';
  if (/401|invalid[_ ]?api[_ ]?key|unauthorized|api key not valid|permission[_ ]denied|no auth credentials/i.test(message)) {
    return 'That key was rejected — double-check it.';
  }
  return message;
}

const VERIFIERS = {
  openai: verifyOpenAIKey,
  gemini: verifyGeminiKey,
  openrouter: verifyOpenRouterKey,
} as const;

// Makes one minimal live call to the provider to confirm a key actually
// works, rather than waiting for the user to discover it during real
// generation. Tests an unsaved value from the field if provided, otherwise
// the key already saved in Settings.
export async function POST(req: NextRequest) {
  try {
    const { provider, key } = (await req.json()) as { provider?: string; key?: string };
    if (provider !== 'openai' && provider !== 'gemini' && provider !== 'openrouter') {
      return NextResponse.json({ error: 'provider must be "openai", "gemini", or "openrouter"' }, { status: 400 });
    }

    let apiKey = key?.trim();
    if (!apiKey) {
      const settings = await getSettings();
      apiKey =
        (provider === 'openai'
          ? settings.openaiApiKey
          : provider === 'gemini'
            ? settings.geminiApiKey
            : settings.openrouterApiKey) ?? undefined;
    }
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No key to test — paste one first' });
    }

    try {
      await VERIFIERS[provider](apiKey);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ ok: false, error: friendlyError(err) });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Verification failed' }, { status: 500 });
  }
}
