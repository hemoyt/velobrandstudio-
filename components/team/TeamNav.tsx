'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { TeamRole } from '@/lib/supabase/database.types';

export function TeamNav({
  teamId,
  teamName,
  role,
}: {
  teamId: string;
  teamName: string;
  role: TeamRole;
}) {
  const pathname = usePathname();
  const isAdmin = role === 'owner' || role === 'admin';

  const links = [
    { href: `/teams/${teamId}`, label: 'Projects' },
    ...(isAdmin
      ? [
          { href: `/teams/${teamId}/settings/members`, label: 'Members' },
          { href: `/teams/${teamId}/settings/keys`, label: 'API Keys' },
          { href: `/teams/${teamId}/settings/activity`, label: 'Activity' },
        ]
      : []),
  ];

  return (
    <div className="w-64 bg-stone-900 text-stone-300 flex flex-col p-6 shadow-2xl z-10 shrink-0">
      <div className="mb-10">
        <Link href="/teams" className="font-serif text-2xl font-bold text-white tracking-tight">
          VeloBrand.
        </Link>
        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mt-2 truncate">{teamName}</p>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/60'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-stone-800 space-y-3">
        <span className="block px-3 py-1 bg-stone-800 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit">
          {role}
        </span>
        <Link href="/teams" className="block text-xs font-semibold text-stone-500 hover:text-white">
          Switch team
        </Link>
        <form action="/api/auth/signout" method="post">
          <button className="text-xs font-semibold text-stone-500 hover:text-white">Sign out</button>
        </form>
      </div>
    </div>
  );
}
