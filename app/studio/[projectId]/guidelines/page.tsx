import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject, type StoredProject } from '@/lib/local/store';
import { fileUrl } from '@/lib/local/files';
import { StudioNav } from '@/components/StudioNav';
import { BrandGuidelines } from '@/components/project/BrandGuidelines';

export const dynamic = 'force-dynamic';

export default async function GuidelinesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: StoredProject;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }

  if (!project.brandIdentity) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <StudioNav />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-3">No brand identity yet</h1>
          <p className="text-stone-500 mb-8">
            Run the setup wizard first — it generates the strategy, colors, and typography these guidelines are built
            from.
          </p>
          <Link
            href={`/studio/${projectId}/setup`}
            className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800"
          >
            Open setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BrandGuidelines
      projectId={projectId}
      name={project.name}
      identity={project.brandIdentity}
      assets={project.assets.map((a) => ({
        id: a.id,
        url: fileUrl(a.file),
        prompt: a.prompt,
        type: a.type,
      }))}
      selectedLogoAssetId={project.selectedLogoAssetId}
    />
  );
}
