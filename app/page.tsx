import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? '/teams' : '/signup';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 overflow-x-hidden">
      <nav className="flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
        <div className="font-serif text-2xl font-bold tracking-tight text-stone-900">VeloBrand.</div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:block text-xs font-semibold tracking-wide uppercase text-stone-400 hover:text-stone-700"
          >
            GitHub
          </a>
          <Link href={primaryHref}>
            <Button size="sm" variant="outline">
              {user ? 'Go to teams' : 'Sign in'}
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 animate-fade-in">
          <div className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 rounded-full text-xs font-semibold tracking-wide uppercase text-stone-600">
            Open-source AI Creative Director
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-medium leading-[1.05] tracking-tight">
            Design your <br />
            <span className="italic text-stone-400 font-light">brand legacy</span> <br />
            with your team.
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-md leading-relaxed font-light">
            From logo concepts to full marketing kits and motion graphics. Bring your own OpenAI and
            Gemini keys, invite your team, and self-host it anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href={primaryHref}>
              <Button size="lg" className="rounded-full px-10">
                {user ? 'Go to teams' : 'Start free'}
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="lg" variant="ghost" className="rounded-full">
                View on GitHub
              </Button>
            </a>
          </div>

          <div className="pt-12 grid grid-cols-3 gap-8 border-t border-stone-200/60">
            <div>
              <div className="text-3xl font-serif text-stone-300">01</div>
              <div className="text-sm font-bold mt-2 uppercase tracking-wide">Brief</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-stone-300">02</div>
              <div className="text-sm font-bold mt-2 uppercase tracking-wide">Curate</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-stone-300">03</div>
              <div className="text-sm font-bold mt-2 uppercase tracking-wide">Launch</div>
            </div>
          </div>
        </div>

        <div className="relative h-[600px] w-full hidden lg:block">
          <div className="absolute top-0 right-0 w-4/5 h-4/5 bg-stone-200 rounded-tl-[120px] rounded-br-[40px] overflow-hidden shadow-inner">
            <Image
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
              alt="Mood board"
              fill
              className="object-cover opacity-60 mix-blend-multiply"
              sizes="(min-width: 1024px) 40vw, 0px"
              priority
            />
          </div>

          <div className="absolute bottom-20 left-10 w-2/3 bg-white p-8 shadow-2xl rounded-tr-[40px] rounded-bl-[40px] flex flex-col justify-between border border-stone-100 backdrop-blur-sm bg-white/90">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-white font-serif italic text-xl">
                V
              </div>
              <div className="space-y-2">
                <div className="w-24 h-1.5 bg-stone-200 rounded-full"></div>
                <div className="w-16 h-1.5 bg-stone-200 rounded-full ml-auto"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-16 w-1/3 bg-[#D4C4B7] rounded-lg"></div>
                <div className="h-16 w-1/3 bg-[#8B7E74] rounded-lg"></div>
                <div className="h-16 w-1/3 bg-[#4A403A] rounded-lg"></div>
              </div>
              <div className="flex gap-2 items-center pt-2">
                <div className="h-1.5 w-full bg-stone-100 rounded-full"></div>
                <div className="h-1.5 w-1/2 bg-stone-100 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="absolute top-10 left-20 w-16 h-16 border-4 border-stone-900 rounded-full opacity-10"></div>
        </div>
      </main>
    </div>
  );
}
