'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { IndustryType } from '@/types';
import { createProject } from '@/lib/project-client';

export default function NewProjectPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState<IndustryType>(IndustryType.GENERAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { project } = await createProject(teamId, clientName, industry);
      router.push(`/teams/${teamId}/projects/${project.id}/setup`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">New brand kit</h1>
        <p className="text-sm text-stone-500 mb-8">Give the project a name and pick the closest industry.</p>

        <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Client / project name</label>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. Marigold Coffee Co."
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
  );
}
