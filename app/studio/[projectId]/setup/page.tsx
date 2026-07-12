import { notFound } from 'next/navigation';
import { getProject, type StoredProject } from '@/lib/local/store';
import { ProjectSetupWizard } from '@/components/project/ProjectSetupWizard';
import type { IndustryType } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProjectSetupPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: StoredProject;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }

  return (
    <ProjectSetupWizard
      projectId={projectId}
      industry={project.industry as IndustryType}
      initialBrief={project.brief}
    />
  );
}
