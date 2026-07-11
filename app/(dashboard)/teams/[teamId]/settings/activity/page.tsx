import { createClient } from '@/lib/supabase/server';

export default async function ActivityPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('activity_log')
    .select('id, action, target_type, metadata, created_at, actor_id')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(100);

  const actorIds = Array.from(new Set((events ?? []).map((e) => e.actor_id).filter((id): id is string => !!id)));
  const { data: profiles } = actorIds.length
    ? await supabase.from('profiles').select('id, email').in('id', actorIds)
    : { data: [] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-10">Activity</h1>
      <div className="max-w-2xl space-y-2">
        {(events ?? []).length === 0 && <p className="text-sm text-stone-400">No activity yet.</p>}
        {(events ?? []).map((event) => (
          <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl text-sm">
            <div>
              <span className="font-semibold text-stone-800">{event.actor_id ? emailById.get(event.actor_id) ?? 'A member' : 'System'}</span>{' '}
              <span className="text-stone-500">{event.action.replace(/[._]/g, ' ')}</span>
            </div>
            <span className="text-xs text-stone-400">{new Date(event.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
