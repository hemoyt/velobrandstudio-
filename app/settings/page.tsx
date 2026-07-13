import { StudioNav } from '@/components/StudioNav';
import { SettingsForm } from '@/components/SettingsForm';
import { getSettings, defaultOutputDir, DATA_DIR } from '@/lib/local/store';

export const dynamic = 'force-dynamic';

function hint(key: string | null): string | null {
  if (!key) return null;
  return key.length > 8 ? `••••${key.slice(-4)}` : '••••';
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <StudioNav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-1">Settings</h1>
        <p className="text-sm text-stone-500 mb-10">
          Everything is local: settings live in <code className="bg-stone-100 px-1.5 py-0.5 rounded">{DATA_DIR}</code>,
          designs in the folder you pick below.
        </p>
        <SettingsForm
          initial={{
            openaiKeyHint: hint(settings.openaiApiKey),
            geminiKeyHint: hint(settings.geminiApiKey),
            openrouterKeyHint: hint(settings.openrouterApiKey),
            openrouterTextModel: settings.openrouterTextModel,
            openrouterImageModel: settings.openrouterImageModel,
            outputDir: settings.outputDir,
            defaultOutputDir: defaultOutputDir(),
          }}
        />
      </main>
    </div>
  );
}
