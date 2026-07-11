import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrls, getSignedUrl } from '@/lib/storage';
import { VideoStudio } from '@/components/project/VideoStudio';

export default async function VideoStudioPage({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const { teamId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, selected_logo_asset_id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: logoAsset }, { data: videos }] = await Promise.all([
    project.selected_logo_asset_id
      ? supabase.from('assets').select('storage_path').eq('id', project.selected_logo_asset_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('videos').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
  ]);

  const logoUrl = logoAsset ? await getSignedUrl(supabase, logoAsset.storage_path) : null;
  const videoUrls = await getSignedUrls(
    supabase,
    (videos ?? []).map((v) => v.storage_path),
  );

  return (
    <VideoStudio
      teamId={teamId}
      projectId={projectId}
      logoUrl={logoUrl}
      initialVideos={(videos ?? []).map((v) => ({
        id: v.id,
        url: videoUrls[v.storage_path] ?? '',
        prompt: v.prompt ?? '',
        hasSound: v.has_sound,
      }))}
    />
  );
}
