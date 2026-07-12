'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProject, duplicateProject } from '@/lib/project-client';

export interface ProjectCard {
  id: string;
  name: string;
  industry: string;
  status: string;
  assetCount: number;
  updatedAt: string;
  logoUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
};

export function ProjectsGrid({ initialProjects }: { initialProjects: ProjectCard[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, project: ProjectCard) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Remove "${project.name}" from the studio? Generated files stay in your designs folder.`)) return;
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, project: ProjectCard) => {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(project.id);
    try {
      const { project: copy } = await duplicateProject(project.id);
      router.push(`/studio/${copy.id}/setup`);
    } catch (err) {
      console.error(err);
      setDuplicating(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif italic text-2xl">
          V
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Start your first brand</h2>
        <p className="text-stone-500 max-w-sm mx-auto mb-8">
          Describe a business and get a full brand kit — logo concepts, guidelines, mockups, and more.
        </p>
        <Link
          href="/studio/new"
          className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          New project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/studio/${project.id}`}
          className="group bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden">
              {project.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="font-serif italic text-xl text-stone-300">{project.name.charAt(0)}</span>
              )}
            </div>
            <span className="px-2.5 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-wide">
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 truncate">{project.name}</h3>
          <p className="text-xs text-stone-400 mt-1">{project.industry}</p>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
            <span className="text-xs text-stone-500 font-medium">
              {project.assetCount} asset{project.assetCount === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleDuplicate(e, project)}
                disabled={duplicating === project.id}
                className="text-[11px] text-stone-400 hover:text-stone-900 font-semibold disabled:opacity-40"
                title="Use as a starting point for a new brand"
              >
                {duplicating === project.id ? 'Copying…' : 'Duplicate'}
              </button>
              <button onClick={(e) => handleDelete(e, project)} className="text-[11px] text-stone-300 hover:text-red-500 font-semibold">
                Remove
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
