import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrls } from '@/lib/storage';
import { mapBrandIdentityRow } from '@/lib/mappers';
import { ProjectDashboard } from '@/components/project/ProjectDashboard';

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const { teamId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user!.id)
    .maybeSingle();
  const canEdit = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'editor';

  const [{ data: brandRow }, { data: assets }, { count: videoCount }] = await Promise.all([
    supabase.from('brand_identities').select('*').eq('project_id', projectId).maybeSingle(),
    supabase.from('assets').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
  ]);

  if (!assets || assets.length === 0) {
    redirect(`/teams/${teamId}/projects/${projectId}/setup`);
  }

  const signedUrls = await getSignedUrls(
    supabase,
    assets.map((a) => a.storage_path),
  );

  const dashboardAssets = assets.map((a) => ({
    id: a.id,
    url: signedUrls[a.storage_path] ?? '',
    prompt: a.prompt ?? '',
    originalPrompt: a.original_prompt ?? undefined,
    type: a.type,
    storagePath: a.storage_path,
  }));

  return (
    <ProjectDashboard
      teamId={teamId}
      projectId={projectId}
      clientName={project.client_name}
      status={project.status}
      shareToken={project.share_token}
      brandIdentity={brandRow ? mapBrandIdentityRow(brandRow) : null}
      initialAssets={dashboardAssets}
      selectedLogoAssetId={project.selected_logo_asset_id}
      videoCount={videoCount ?? 0}
      canEdit={canEdit}
    />
  );
}
