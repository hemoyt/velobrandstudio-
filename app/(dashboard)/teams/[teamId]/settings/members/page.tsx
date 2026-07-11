import { createClient } from '@/lib/supabase/server';
import { MembersSettings } from '@/components/team/MembersSettings';

export default async function MembersSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-10">Team members</h1>
      <MembersSettings teamId={teamId} currentUserId={user!.id} />
    </div>
  );
}
