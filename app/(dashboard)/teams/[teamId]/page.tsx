import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/Button';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-stone-100 text-stone-500',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-stone-200 text-stone-400',
};

export default async function TeamProjectsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('team_id', teamId)
    .order('updated_at', { ascending: false });

  return (
    <div className="p-8 lg:p-12">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Projects</h1>
          <p className="text-stone-500 text-sm mt-1">Brand kits your team is working on.</p>
        </div>
        <Link href={`/teams/${teamId}/projects/new`}>
          <Button className="rounded-full px-6">New Project</Button>
        </Link>
      </header>

      {(!projects || projects.length === 0) && (
        <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl">
          <p className="text-stone-400">No projects yet.</p>
          <Link href={`/teams/${teamId}/projects/new`} className="text-stone-900 font-semibold hover:underline mt-2 inline-block">
            Start your first brand kit
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/teams/${teamId}/projects/${project.id}`}
            className="block bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-stone-900 truncate pr-2">{project.client_name}</h3>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[project.status]}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">{project.industry}</p>
            <p className="text-xs text-stone-400 mt-4">
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
