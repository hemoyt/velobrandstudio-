import Link from 'next/link';

const STEPS = [
  {
    n: '01',
    title: 'Describe the brand',
    text: 'Write a few sentences — or paste a website and let the AI draft the brief for you.',
  },
  {
    n: '02',
    title: 'Pick a direction',
    text: 'Choose from generated logo concepts in the style you want, or upload your own mark.',
  },
  {
    n: '03',
    title: 'Get the full kit',
    text: 'Guidelines, mockups, business cards, social templates, and video — saved to your folder.',
  },
];

const FEATURES = [
  {
    title: 'Complete brand guidelines',
    text: 'Mission, values, voice, logo usage rules, color system, and typography — as a live page in the app and an exportable PDF.',
  },
  {
    title: 'Logo concepts & variants',
    text: 'Multiple directions per brief across eight visual styles, plus app-icon, header, and profile versions of the winner.',
  },
  {
    title: 'Mockups & collateral',
    text: 'Industry-aware mockups, business cards, letterheads, email signatures, and social templates, generated around your logo.',
  },
  {
    title: 'Motion Lab',
    text: 'Turn the logo or a prompt into cinematic video with Veo — aspect ratio, resolution, and sound included.',
  },
  {
    title: 'Your keys, your costs',
    text: 'Paste your own OpenAI or Gemini API key in Settings. No subscription, no middleman, no usage caps.',
  },
  {
    title: 'Everything saved locally',
    text: 'Every design lands in a folder you choose, organized by project — logos/, mockups/, videos/. Yours to keep.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 overflow-x-hidden">
      <nav className="flex items-center justify-between px-6 py-6 md:px-12 max-w-6xl mx-auto">
        <div className="font-serif text-2xl font-bold tracking-tight">VeloBrand.</div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/hemoyt/velobrandstudio-"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900"
          >
            GitHub
          </a>
          <Link
            href="/studio"
            className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Open the studio
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Hero */}
        <section className="pt-16 pb-20 text-center">
          <div className="inline-block px-4 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-semibold tracking-wide uppercase text-stone-600 mb-8">
            Open-source · Local-first · Bring your own AI keys
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.08] tracking-tight max-w-4xl mx-auto">
            A complete <span className="italic text-stone-400 font-light">brand studio</span> that runs on your machine.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-light">
            From a one-paragraph brief to logos, full brand guidelines, mockups, and motion — install it, paste your
            API key, and every design is saved to a folder you choose.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/studio"
              className="px-10 py-4 bg-stone-900 text-white rounded-full text-base font-medium hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200"
            >
              Start creating — it&apos;s free
            </Link>
            <a
              href="https://github.com/hemoyt/velobrandstudio-"
              target="_blank"
              rel="noreferrer"
              className="px-10 py-4 border border-stone-300 rounded-full text-base font-medium text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Product shot */}
        <section className="pb-24">
          <div className="rounded-3xl border border-stone-200 shadow-2xl shadow-stone-200/60 overflow-hidden bg-white">
            <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-stone-100 bg-stone-50">
              <span className="w-3 h-3 rounded-full bg-stone-200" />
              <span className="w-3 h-3 rounded-full bg-stone-200" />
              <span className="w-3 h-3 rounded-full bg-stone-200" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/screenshots/dashboard.jpg" alt="VeloBrand Studio dashboard" className="w-full" />
          </div>
        </section>

        {/* How it works */}
        <section className="pb-24">
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-center mb-16">
            Brief to brand in three steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-white rounded-3xl border border-stone-200 p-10">
                <div className="text-4xl font-serif text-stone-200 mb-6">{step.n}</div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="pb-24">
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-center mb-16">
            Everything a brand launch needs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-8 rounded-2xl border border-stone-200 bg-white hover:shadow-lg transition-shadow">
                <h3 className="font-bold mb-2.5">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-24">
          <div className="bg-stone-900 rounded-[2.5rem] px-8 py-20 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-serif font-medium mb-6">
              Install it. Add your key. <span className="italic text-stone-400">Build the brand.</span>
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto mb-10">
              <code className="text-stone-300">npm install && npm run dev</code> — that&apos;s the whole setup. No
              database, no account, no cloud.
            </p>
            <Link
              href="/studio"
              className="inline-block px-10 py-4 bg-white text-stone-900 rounded-full text-base font-medium hover:bg-stone-100 transition-colors"
            >
              Open the studio
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-10 text-center text-xs text-stone-400">
        VeloBrand Studio — open-source under the MIT license.
      </footer>
    </div>
  );
}
