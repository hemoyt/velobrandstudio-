import { createAdminClient } from '@/lib/supabase/server';
import { decryptSecret } from '@/lib/crypto';
import { createOpenAIProvider } from './openai';
import { createGeminiProvider } from './gemini';
import type { AIProvider } from './types';
import { AIProviderError } from './types';
import type { AiProvider } from '@/lib/supabase/database.types';

/**
 * Reads + decrypts a team's provider key using the service-role client.
 *
 * This intentionally bypasses the provider_keys RLS policy (which restricts
 * SELECT to admins) — callers must have already authorized the caller via
 * lib/authz.ts (requireProjectRole / requireTeamRole) before reaching here.
 * Any team member with at least 'editor' access can *use* a configured key to
 * generate assets; only admins can *view or manage* keys in Settings.
 */
async function getDecryptedKey(teamId: string, provider: AiProvider): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('provider_keys')
    .select('encrypted_key')
    .eq('team_id', teamId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return decryptSecret(data.encrypted_key);
}

async function configuredProviders(teamId: string): Promise<Set<AiProvider>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from('provider_keys').select('provider').eq('team_id', teamId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.provider));
}

function buildProvider(name: AiProvider, apiKey: string): AIProvider {
  return name === 'openai' ? createOpenAIProvider(apiKey) : createGeminiProvider(apiKey);
}

/** Prefers OpenAI (GPT Image 2) for image generation/editing; falls back to Gemini. */
export async function getImageProvider(teamId: string): Promise<AIProvider> {
  const configured = await configuredProviders(teamId);

  if (configured.has('openai')) {
    const key = await getDecryptedKey(teamId, 'openai');
    if (key) return buildProvider('openai', key);
  }
  if (configured.has('gemini')) {
    const key = await getDecryptedKey(teamId, 'gemini');
    if (key) return buildProvider('gemini', key);
  }

  throw new AIProviderError(
    'No image-generation provider configured for this team. Add an OpenAI or Gemini API key in Team Settings.',
    422,
  );
}

/** Brand-identity text, prompt helpers, and video all run on Gemini (OpenAI has no video model). */
export async function getGeminiProvider(teamId: string): Promise<AIProvider> {
  const key = await getDecryptedKey(teamId, 'gemini');
  if (!key) {
    throw new AIProviderError(
      'No Gemini API key configured for this team. Add one in Team Settings.',
      422,
    );
  }
  return buildProvider('gemini', key);
}
