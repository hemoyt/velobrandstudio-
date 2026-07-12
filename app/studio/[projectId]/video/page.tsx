import { notFound } from 'next/navigation';
import { getProject, type StoredProject } from '@/lib/local/store';
import { fileUrl } from '@/lib/local/files';
import { VideoStudio } from '@/components/project/VideoStudio';

export const dynamic = 'force-dynamic';

export default async function VideoStudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: StoredProject;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }

  const logoAsset = project.assets.find((a) => a.id === project.selectedLogoAssetId);

  return (
    <VideoStudio
      projectId={projectId}
      logoUrl={logoAsset ? fileUrl(logoAsset.file) : null}
      initialVideos={[...project.videos].reverse().map((v) => ({
        id: v.id,
        url: fileUrl(v.file),
        prompt: v.prompt,
        hasSound: v.hasSound,
      }))}
    />
  );
}
