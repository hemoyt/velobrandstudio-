import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectSetupWizard } from '@/components/project/ProjectSetupWizard';
import type { IndustryType } from '@/types';

export default async function ProjectSetupPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const { teamId, projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, industry, brief')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) notFound();

  return (
    <ProjectSetupWizard
      teamId={teamId}
      projectId={projectId}
      industry={project.industry as IndustryType}
      initialBrief={project.brief ?? ''}
    />
  );
}
