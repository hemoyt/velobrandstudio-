'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudioNav } from '@/components/StudioNav';
import { Button } from '@/components/Button';
import { IndustryType } from '@/types';
import { createProject } from '@/lib/project-client';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<IndustryType>(IndustryType.GENERAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { project } = await createProject(name, industry);
      router.push(`/studio/${project.id}/setup`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create the project');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <StudioNav />
      <div className="flex items-center justify-center p-8 pt-20">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">New brand project</h1>
          <p className="text-sm text-stone-500 mb-8">Name the brand and pick the closest industry.</p>

          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Brand / project name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marigold Coffee Co."
            autoFocus
            className="mt-1 mb-6 w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
          />

          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryType)}
            className="mt-1 mb-8 w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white"
          >
            {Object.values(IndustryType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Button type="submit" isLoading={isLoading} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
