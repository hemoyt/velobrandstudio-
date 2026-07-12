'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

interface SettingsData {
  openaiKeyHint: string | null;
  geminiKeyHint: string | null;
  outputDir: string;
  defaultOutputDir: string;
}

async function putSettings(body: Record<string, unknown>): Promise<SettingsData> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to save settings');
  return data as SettingsData;
}

async function verifyKey(provider: 'openai' | 'gemini', key?: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/settings/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || 'Verification failed' };
  return data as { ok: boolean; error?: string };
}

function KeyField({
  provider,
  label,
  help,
  hint,
  onSave,
  onClear,
}: {
  provider: 'openai' | 'gemini';
  label: string;
  help: string;
  hint: string | null;
  onSave: (value: string) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const save = async () => {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(value.trim());
      setValue('');
      setTestResult(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setTestBusy(true);
    setTestResult(null);
    try {
      setTestResult(await verifyKey(provider, value.trim() || undefined));
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-bold text-stone-800">{label}</label>
        {hint ? (
          <span className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
            Saved {hint}
            <button onClick={onClear} className="text-red-400 hover:text-red-600 font-bold" title="Remove key">
              ✕
            </button>
          </span>
        ) : (
          <span className="text-xs text-stone-400">Not set</span>
        )}
      </div>
      <p className="text-xs text-stone-500 mb-4">{help}</p>
      <div className="flex gap-3">
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTestResult(null);
          }}
          placeholder={hint ? 'Paste a new key to replace it' : 'Paste your API key'}
          className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
        />
        <Button size="sm" variant="outline" onClick={test} isLoading={testBusy} disabled={!value.trim() && !hint}>
          Test
        </Button>
        <Button size="sm" onClick={save} isLoading={busy} disabled={!value.trim()}>
          Save
        </Button>
      </div>
      {testResult && (
        <p className={`text-sm mt-3 ${testResult.ok ? 'text-green-700' : 'text-red-600'}`}>
          {testResult.ok ? '✓ Key works.' : `✕ ${testResult.error}`}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: SettingsData }) {
  const [settings, setSettings] = useState(initial);
  const [dirValue, setDirValue] = useState(initial.outputDir);
  const [dirBusy, setDirBusy] = useState(false);
  const [dirSaved, setDirSaved] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  const saveDir = async () => {
    if (!dirValue.trim()) return;
    setDirBusy(true);
    setDirError(null);
    setDirSaved(false);
    try {
      const next = await putSettings({ outputDir: dirValue.trim() });
      setSettings(next);
      setDirValue(next.outputDir);
      setDirSaved(true);
    } catch (err: unknown) {
      setDirError(err instanceof Error ? err.message : 'Failed to save folder');
    } finally {
      setDirBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-1">AI provider keys</h2>
        <p className="text-sm text-stone-500 mb-5">
          Bring your own keys — they&apos;re stored only on this machine and are never sent anywhere except directly to
          the provider. One key of either kind is enough to run the whole studio; Gemini additionally unlocks video.
        </p>
        <div className="space-y-4">
          <KeyField
            provider="openai"
            label="OpenAI API key"
            help="Used for image generation and editing (GPT Image 2). Get one at platform.openai.com."
            hint={settings.openaiKeyHint}
            onSave={async (v) => setSettings(await putSettings({ openaiApiKey: v }))}
            onClear={async () => setSettings(await putSettings({ openaiApiKey: null }))}
          />
          <KeyField
            provider="gemini"
            label="Gemini API key"
            help="Used for brand strategy text, prompt helpers, and video generation with Veo. Get one at aistudio.google.com."
            hint={settings.geminiKeyHint}
            onSave={async (v) => setSettings(await putSettings({ geminiApiKey: v }))}
            onClear={async () => setSettings(await putSettings({ geminiApiKey: null }))}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-1">Designs folder</h2>
        <p className="text-sm text-stone-500 mb-5">
          Every generated logo, mockup, and video is saved here, organized by project. Pick any folder on your machine.
        </p>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex gap-3">
            <input
              value={dirValue}
              onChange={(e) => {
                setDirValue(e.target.value);
                setDirSaved(false);
              }}
              placeholder={settings.defaultOutputDir}
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            <Button size="sm" onClick={saveDir} isLoading={dirBusy} disabled={!dirValue.trim() || dirValue === settings.outputDir}>
              Save
            </Button>
          </div>
          {dirSaved && <p className="text-sm text-green-700 mt-3">Folder saved. New designs will be written there.</p>}
          {dirError && <p className="text-sm text-red-600 mt-3">{dirError}</p>}
          <p className="text-xs text-stone-400 mt-4">
            Currently: <code className="bg-stone-100 px-1.5 py-0.5 rounded">{settings.outputDir}</code>
            <br />
            If you change this later, move the existing project folders into the new location so older projects keep
            displaying.
          </p>
        </div>
      </section>
    </div>
  );
}
