import Link from 'next/link';
import { StudioNav } from '@/components/StudioNav';
import { ProjectsGrid, type ProjectCard } from '@/components/ProjectsGrid';
import { listProjects, getSettings } from '@/lib/local/store';
import { fileUrl } from '@/lib/local/files';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const [projects, settings] = await Promise.all([listProjects(), getSettings()]);
  const hasKey = !!(settings.openaiApiKey || settings.geminiApiKey);

  const cards: ProjectCard[] = projects.map((p) => {
    const logo = p.assets.find((a) => a.id === p.selectedLogoAssetId) ?? p.assets.find((a) => a.type === 'logo');
    return {
      id: p.id,
      name: p.name,
      industry: p.industry,
      status: p.status,
      assetCount: p.assets.length,
      updatedAt: p.updatedAt,
      logoUrl: logo ? fileUrl(logo.file) : null,
    };
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <StudioNav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        {!hasKey && (
          <Link
            href="/settings"
            className="flex items-center justify-between gap-4 mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100/60 transition-colors"
          >
            <div>
              <p className="font-bold text-sm text-amber-900">Add your AI key to start generating</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Paste your own OpenAI or Gemini API key in Settings — it stays on this machine.
              </p>
            </div>
            <span className="text-sm font-bold text-amber-900 whitespace-nowrap">Open Settings →</span>
          </Link>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Projects</h1>
            <p className="text-sm text-stone-500 mt-1">Every brand you&apos;re building, saved on your machine.</p>
          </div>
          <Link
            href="/studio/new"
            className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            New project
          </Link>
        </div>

        <ProjectsGrid initialProjects={cards} />
      </main>
    </div>
  );
}
