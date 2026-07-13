<div align="center">

# VeloBrand Studio

**A complete AI brand studio that runs on your machine.** Describe a business — or paste its website — and get a full brand: logo concepts, brand identity and guidelines, mockups, business cards, social templates, and cinematic video. Install it, paste your own API key in Settings, and every design is saved to a folder you choose.

[![CI](https://github.com/hemoyt/velobrandstudio-/actions/workflows/ci.yml/badge.svg)](https://github.com/hemoyt/velobrandstudio-/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org)
[![Local-first](https://img.shields.io/badge/local--first-no%20database%2C%20no%20account-black)](#how-it-stores-your-work)

</div>

---

## Install & run

```bash
git clone https://github.com/hemoyt/velobrandstudio-.git
cd velobrandstudio-
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Settings**, paste an API key, and pick the folder where your designs should be saved. That's the entire setup — no database, no account, no environment variables.

- One key of any kind runs the whole studio (logos, identity, mockups).
- A **Gemini** key additionally unlocks video generation (Veo) — no other provider offers video.
- An **OpenRouter** key is optional flexibility: one key, hundreds of models (Claude, Gemini, Llama, DeepSeek, ...), picked by typing a model slug in Settings. It's used as a fallback if OpenAI/Gemini aren't set, or you can point either capability at it directly to try a different model.
- Keys are stored only on your machine (`~/.velobrand/settings.json`) and are sent nowhere except directly to the provider.

## Tour

| | |
|---|---|
| ![Landing page](public/screenshots/landing.jpg) **Landing** — the pitch: a complete brand studio on your machine. | ![Projects](public/screenshots/projects.jpg) **Projects** — every brand you're building, with a setup nudge until a key is added. |
| ![Project dashboard](public/screenshots/dashboard.jpg) **Dashboard** — strategy, palette, typography, and every asset, with the exact folder your files live in. | ![Brand guidelines](public/screenshots/guidelines.jpg) **Brand guidelines** — a full, live style guide: mission, values, logo usage rules, color system, type, voice. Exportable as PDF. |
| ![Settings](public/screenshots/settings.jpg) **Settings** — paste your API keys and choose your designs folder. Nothing leaves your machine. | ![Motion Lab](public/screenshots/motion-lab.jpg) **Motion Lab** — turn the logo or a prompt into cinematic video with Veo. |

## What you get per project

1. **Brief** — write a description, import it from an existing website, or upload your own logo. AI-enhance the wording if you want.
2. **Logo concepts** — four directions per run across eight styles (minimalist, vintage, luxury, abstract, mascot, hand-drawn, cyberpunk, 3D), plus app-icon / website-header / profile variants of the winner.
3. **Brand identity** — mission, values, personality, tagline, voice, target audience, elevator pitch, per-platform social bios, sample captions, imagery direction, a color palette with usage weighting, and a Google Fonts pairing. Every field is editable inline or regenerable individually with AI — nothing is locked to the first draft.
4. **Brand guidelines** — a live, editable page in the app (and a printable PDF) with logo clear-space and minimum-size rules, do's and don'ts, quick logo iteration (bolder, rounder, more minimal, different color), the color system with hex/RGB and a WCAG contrast badge per swatch, and real Google Fonts rendering with a font picker.
5. **Collateral** — industry-aware mockups (tech, fashion, retail, hospitality, coffee, general), business cards, letterhead, email signature, presentation cover, favicon set, and social templates — generated concurrently around your chosen logo.
6. **Motion** — text- or logo-to-video with aspect ratio, resolution, and sound controls.
7. **In-browser editor** — logo placement, text layers, undo history, AI smart-erase and freeform edits on any asset.
8. **Full-kit ZIP export** — every generated file plus a self-contained, offline-viewable brand-guidelines.html and the raw brand-identity.json, in one download.
9. **Duplicate a project** — spin off a sibling brand from an existing brief and identity as a starting point, without touching the original's files.

## How it stores your work

Everything is a plain file you can see:

```
~/.velobrand/                     # app data (change with VELOBRAND_HOME)
  settings.json                   # your API keys + chosen designs folder
  projects/<id>.json              # one record per project

<your designs folder>/            # chosen in Settings (default ~/VeloBrand)
  moss-and-mist/
    logos/                        # every generated logo + variants
    mockups/                      # coffee cup, letterhead, signage...
    business-cards/
    social-templates/
    social-posts/
    videos/                       # Veo renders as .mp4
```

Deleting a project in the app only removes its record — your design files are never touched. If you change the designs folder later, move the existing project folders across so older projects keep displaying.

## Providers & models

| Capability | Runs on | Notes |
|---|---|---|
| Image generation & editing | OpenAI **GPT Image 2** (preferred) → Gemini → OpenRouter | Whichever key you've added, in that order. OpenRouter only works on the models it's enabled image output for (default: `google/gemini-2.5-flash-image-preview`). |
| Brand identity & prompt helpers | Gemini `gemini-2.5-flash` (preferred) → OpenAI `gpt-4o-mini` → OpenRouter | OpenRouter's model is configurable in Settings — any chat model on openrouter.ai/models works. |
| Video | Gemini **Veo 3.1** only | Neither OpenAI nor OpenRouter offer a video model today. |

**Why OpenRouter?** It's a single OpenAI-compatible API in front of hundreds of models from many labs, so it's the "flexibility" option — swap models without touching code, keep working if OpenAI/Gemini have an outage, or try a cheaper/better model for text as they change. It's not a dedicated image/video service: image support is limited to the few multimodal chat models OpenRouter has turned image output on for, and it has no video generation at all.

## Run with Docker

```bash
docker compose up --build
```

Settings and designs persist in named volumes; swap the `velobrand-designs` volume for a bind mount (e.g. `./designs:/data/designs`) to browse your files directly on the host — that's the path you'd pick in Settings.

## Good to know

- **This is a local, single-user tool.** There's no login — anyone who can reach the port can use the studio and read its files, so keep it on localhost or behind your own reverse-proxy auth if you expose it. Serverless platforms (Vercel, etc.) won't work: the app needs a persistent filesystem.
- **Website import** fetches the URL you paste from your machine, with localhost/private-IP ranges blocked as an accident guardrail.
- **Video takes minutes** — that's Veo rendering, not the app hanging. The MP4 lands in your designs folder when done.
- **No job queue** — generation runs in-request, which is fine for one person; keep the tab open during a big kit build.
- **Test your key before you generate** — the Settings page has a "Test" button next to each key field that makes one minimal live call to the provider, so a bad key fails fast instead of mid-kit.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
