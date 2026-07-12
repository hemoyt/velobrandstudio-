import path from 'path';
import { notFound, redirect } from 'next/navigation';
import { getProject, getSettings, type StoredProject } from '@/lib/local/store';
import { fileUrl } from '@/lib/local/files';
import { ProjectDashboard } from '@/components/project/ProjectDashboard';

export const dynamic = 'force-dynamic';

export default async function ProjectDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: StoredProject;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }
  const settings = await getSettings();

  if (project.assets.length === 0) {
    redirect(`/studio/${projectId}/setup`);
  }

  return (
    <ProjectDashboard
      projectId={projectId}
      name={project.name}
      status={project.status}
      brandIdentity={project.brandIdentity}
      initialAssets={project.assets.map((a) => ({
        id: a.id,
        url: fileUrl(a.file),
        prompt: a.prompt,
        originalPrompt: a.originalPrompt ?? undefined,
        type: a.type,
      }))}
      selectedLogoAssetId={project.selectedLogoAssetId}
      videoCount={project.videos.length}
      folderPath={path.join(settings.outputDir, project.folder)}
    />
  );
}
