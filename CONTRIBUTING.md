# Contributing to VeloBrand Studio

## Getting set up

1. `npm install`
2. `npm run dev`
3. Open http://localhost:3000, add your own OpenAI/Gemini key in **Settings**, and pick a designs folder.

That's it — there is no database or cloud dependency. App data lands in `~/.velobrand` (override with `VELOBRAND_HOME` if you want to keep test data separate from your real projects).

## Project structure

- `app/` — Next.js App Router pages and `api/*` route handlers.
- `lib/local/` — the local-first core: `store.ts` (settings + project JSON records, per-project write lock) and `files.ts` (writing/serving design files inside the user's chosen folder).
- `lib/providers/` — the provider-agnostic AI interface (`openai.ts`, `gemini.ts`, shared `brand-prompt.ts`). Add a new provider here rather than special-casing it elsewhere.
- `components/` — shared UI (`Button`, `ImageEditor`, `StudioNav`) and `project/` feature components (setup wizard, dashboard, guidelines, video studio).

## Things to keep true

- **Keys stay local.** Full API keys must never be returned to the browser — the settings API only ever sends a masked hint.
- **The designs folder is the user's.** Never delete or rewrite files in it beyond writing new assets; deleting a project must not touch it.
- **Path safety.** Anything served from disk goes through `readDesignFile`, which refuses paths that escape the designs folder. Keep it that way.

## Before opening a PR

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Reporting security issues

Please don't open a public issue for security vulnerabilities (e.g. a path traversal in the file-serving route or a way to exfiltrate stored keys). Use GitHub's private security advisory feature instead.
