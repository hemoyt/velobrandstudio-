import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CreateTeamForm } from '@/components/team/CreateTeamForm';

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('team_members')
    .select('role, teams:team_id (id, name, slug, created_at)')
    .order('joined_at', { ascending: true });

  const teams = (data ?? []).map((row) => ({ ...row.teams!, role: row.role }));

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            VeloBrand.
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="text-xs font-semibold uppercase tracking-wide text-stone-400 hover:text-stone-700">
              Sign out
            </button>
          </form>
        </div>

        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">Your teams</h1>
        <p className="text-stone-500 mb-8">Pick a team to open its projects, or create a new one.</p>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm mb-8">
          <CreateTeamForm />
        </div>

        <div className="space-y-3">
          {teams.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-12">No teams yet — create your first one above.</p>
          )}
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:border-stone-300 transition-all"
            >
              <div>
                <p className="font-bold text-stone-900">{team.name}</p>
                <p className="text-xs text-stone-400 mt-1">/{team.slug}</p>
              </div>
              <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-bold uppercase tracking-wide">
                {team.role}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
