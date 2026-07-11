# Contributing to VeloBrand Studio

## Getting set up

1. `npm install`
2. Create a free [Supabase](https://supabase.com) project (or run one locally with `supabase start`, see [self-hosting docs](https://supabase.com/docs/guides/self-hosting)).
3. Apply the schema: run the SQL files in `supabase/migrations/` against your project (via the SQL editor, or `supabase db push` if you have the CLI linked).
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL/keys and a generated `ENCRYPTION_KEY` (`openssl rand -base64 32`).
5. `npm run dev`, sign up, create a team, and add your own OpenAI/Gemini key from Team Settings to test generation.

## Project structure

- `app/` — Next.js App Router pages and `api/*` route handlers.
- `lib/providers/` — the provider-agnostic AI interface (`openai.ts` for GPT Image 2, `gemini.ts` for text/video). Add a new provider here rather than special-casing it elsewhere.
- `lib/authz.ts` — role checks (`requireProjectRole` / `requireTeamRole`) that every mutating API route should go through.
- `supabase/migrations/` — schema + RLS. Row-level security is the actual authorization boundary for reads; API-route checks are for writes and for returning clean error messages.
- `components/` — shared UI (`Button`, `ImageEditor`) and feature folders (`team/`, `project/`).

## Before opening a PR

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- If you touched `supabase/migrations/`, double check RLS policies still enforce viewer/editor/admin/owner boundaries — a broken policy is a security bug, not just a test failure.

## Reporting security issues

Please don't open a public issue for security vulnerabilities (e.g. an RLS bypass, a way to read another team's provider key). Use GitHub's private security advisory feature instead.
