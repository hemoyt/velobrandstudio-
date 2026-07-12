'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function StudioNav() {
  const pathname = usePathname();

  const links = [
    { href: '/studio', label: 'Projects', active: pathname === '/studio' || pathname.startsWith('/studio/') },
    { href: '/settings', label: 'Settings', active: pathname.startsWith('/settings') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur border-b border-stone-200/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight text-stone-900">
          VeloBrand.
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                link.active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/hemoyt/velobrandstudio-"
            target="_blank"
            rel="noreferrer"
            className="ml-2 px-4 py-2 rounded-full text-sm font-medium text-stone-400 hover:text-stone-700 hidden sm:block"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
