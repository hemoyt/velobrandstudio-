'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import type { AiProvider } from '@/lib/supabase/database.types';

interface ProviderKeyRow {
  id: string;
  provider: AiProvider;
  created_at: string;
}

const PROVIDER_INFO: Record<AiProvider, { label: string; helper: string; keyHelp: string }> = {
  openai: {
    label: 'OpenAI',
    helper: 'Used for image generation (GPT Image 2) — logos, mockups, business cards, social assets.',
    keyHelp: 'Starts with sk-...',
  },
  gemini: {
    label: 'Google Gemini',
    helper: 'Used for brand identity text, prompt helpers, and video generation (Veo). Also usable as a fallback image provider.',
    keyHelp: 'From Google AI Studio.',
  },
};

export function ProviderKeysSettings({ teamId }: { teamId: string }) {
  const [keys, setKeys] = useState<ProviderKeyRow[]>([]);
  const [drafts, setDrafts] = useState<Record<AiProvider, string>>({ openai: '', gemini: '' });
  const [isLoading, setIsLoading] = useState<AiProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(`/api/teams/${teamId}/provider-keys`);
    const data = await res.json();
    setKeys(data.providerKeys ?? []);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const configured = new Map(keys.map((k) => [k.provider, k]));

  const handleSave = async (provider: AiProvider) => {
    const apiKey = drafts[provider].trim();
    if (!apiKey) return;
    setIsLoading(provider);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/provider-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save key');
      setDrafts((prev) => ({ ...prev, [provider]: '' }));
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleRemove = async (provider: AiProvider) => {
    if (!confirm(`Remove the ${PROVIDER_INFO[provider].label} key for this team?`)) return;
    await fetch(`/api/teams/${teamId}/provider-keys/${provider}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {(Object.keys(PROVIDER_INFO) as AiProvider[]).map((provider) => {
        const info = PROVIDER_INFO[provider];
        const existing = configured.get(provider);
        return (
          <div key={provider} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-900">{info.label}</h3>
              {existing && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Configured
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mb-4">{info.helper}</p>

            {existing ? (
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Added {new Date(existing.created_at).toLocaleDateString()} — key is encrypted at rest.</span>
                <button onClick={() => handleRemove(provider)} className="text-red-500 hover:text-red-700 font-semibold">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="password"
                  value={drafts[provider]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={info.keyHelp}
                  className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Button onClick={() => handleSave(provider)} isLoading={isLoading === provider} size="sm">
                  Save
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
