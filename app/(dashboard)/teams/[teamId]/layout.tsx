import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamNav } from '@/components/team/TeamNav';

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: team } = await supabase.from('teams').select('id, name').eq('id', teamId).maybeSingle();
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!team || !membership) notFound();

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFBF7]">
      <TeamNav teamId={team.id} teamName={team.name} role={membership.role} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
