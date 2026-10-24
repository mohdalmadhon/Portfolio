# Voxel Portfolio — a Minecraft‑inspired 3D developer portfolio

An explorable voxel island built with **Vue 3 + TypeScript + Vite + Three.js**. Your Minecraft character stands at the centre with a cursor-driven **skeleton X‑ray reveal**. Projects, skills and GitHub activity are pulled from your **real public GitHub data**. The site deploys to **GitHub Pages** with the included GitHub Action.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build to dist/
npm run preview      # serve the production build
```

Node 20+ is required (22 recommended).

---

## Deploy to GitHub Pages (5 minutes)

1. Create a GitHub repository and push this folder to its `main` branch.
   - Name it `<your-username>.github.io` to serve the site at `https://<your-username>.github.io/`, **or**
   - use any other name (e.g. `portfolio`) to serve it at `https://<your-username>.github.io/portfolio/`.
     Both work without changes because the build uses relative paths and hash routing.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. (Optional) **Settings → Secrets and variables → Actions**:
   - Variable `GH_USERNAME`: your GitHub username. If omitted, the repository owner is used.
   - Variable `CONTACT_ENDPOINT`: a form endpoint URL (see *Contact form*).
   - Secret `GH_STATS_TOKEN`: a fine-grained personal access token with **no permissions** (public data only). This is optional. The default Actions token already works; your own token gives higher rate limits.
4. Push to `main`, or run the workflow manually from the **Actions** tab.

The workflow (`.github/workflows/deploy.yml`) runs on every push and **once a day**. Each run collects fresh public GitHub data, builds the site and publishes it.

---

## Configure your content

Everything personal lives in **`src/config/site.ts`**.

| What | Where |
| --- | --- |
| GitHub username | `githubUsername` (set to `mohdalmadhon`), or env `VITE_GITHUB_USERNAME`. |
| Display name | taken from your GitHub profile; override with `displayNameOverride` |
| Hero intro, About texts | `heroIntro`, `about.*` |
| Email, LinkedIn, other links | `contact.email`, `contact.links` (e.g. `{ label: 'LinkedIn', url: 'https://linkedin.com/in/…' }`) |
| Pinned projects | `featuredRepos: ['repo-name']`. These are shown first, marked "Pinned by me". |
| Hide repositories | `hiddenRepos: ['repo-name']` |
| Experience & education | `experience` |
| Certifications & awards | `achievements` |
| Services | `services`. Remove any you don't offer. |
| Testimonials | `testimonials`. The section stays hidden until you add a real one. |
| Currently learning | `learning` |
| Development journey | `journey` |
| Interests & fun facts | `interests` |

**Drafts.** Any item with `draft: true` shows only in development (or when `?drafts` is added to the URL) and is marked **DRAFT**. Placeholder entries ship as drafts, so nothing invented appears on the live site. Replace them with real details and remove `draft: true`. A section with no published items is hidden automatically, together with its navigation entry.

### Minecraft skin

`public/skin.png` is the character texture (standard 64×64 layout, classic or slim arms; slim is detected automatically).

> The skin in this repo was **hand-painted from your front, back and side screenshots**: brown fringe, dark red-brown hair at the back, red beard and moustache, purple eyes, buffalo-plaid flannel with grey rolled cuffs, leather belt with pouches, jeans with grey patches and rolled cuffs, brown boots. To get a pixel-exact match, download your real skin file (64×64 `.png`) and copy it over `public/skin.png`. `npm run textures` repaints the textures but **never overwrites an existing `skin.png`** unless you pass `--force`.

A cape is supported but switched off (`skin.cape: false` in `site.ts`). The skeleton texture (`public/textures/skeleton.png`) is original pixel art made by `scripts/generate-textures.mjs`.

### Themes and worlds

The ☀/☾ button in the top bar (and **⚙ → Theme**) switches between:

- **Light mode:** grey inventory-style panels over the **overworld island**. Scrolling moves the sky from day to sunset.
- **Dark mode:** dark panels over an **Ancient City–style deep dark**. It has deepslate floors with glowing sculk, a giant deepslate and reinforced-deepslate frame, soul lanterns, candles, ruined walls and drifting cyan particles.

By default the site follows the visitor's system setting. The choice is remembered per visitor.

### Fonts and first visit

On a visitor's very first visit, a small "Create your world" screen asks for **light or dark** and **pixel or normal font**. Both can be changed later in **⚙**.

### Language and technology logos

Language and technology logos come from [Devicon](https://devicon.dev) (MIT licence, see `public/logos/LICENSE-devicon.txt`). They are bundled locally in `public/logos/`, and the mapping is in `src/services/logos.ts`.

### Icons

Icons are original 16×16 sprites in the game's item style, with dark outlines and three-tone shading (`src/components/ui/icons.ts`). Blocks (grass, crafting table, chest …) are drawn as isometric cubes from the same pixel textures the 3D world uses (`src/art/`). No Mojang textures are copied.

### CV / résumé

Put your PDF at **`public/cv.pdf`**. The "Download CV" button appears automatically when the file exists. Change the path or label with `cv` in `site.ts`.

### Blog articles

Add Markdown files to **`src/content/posts/`**:

```markdown
---
title: My article
date: 2026-11-01
excerpt: One-sentence summary.
category: Tutorial
tags: go, websockets
---

Article body in Markdown (headings, lists, links, code blocks, quotes).
```

Each article gets its own page at `#/blog/<file-name>`. The included sample post has `sample: true`, so it only appears in drafts mode. Delete it whenever you like. Markdown is rendered by a small built-in renderer that escapes HTML and allows only `http(s)` links.

### Contact form

The form sends messages to **mohammedalmadhoon000@gmail.com** through [FormSubmit](https://formsubmit.co), which needs no account or server.

- **One-time activation:** the first message anyone sends triggers an activation email from FormSubmit to that inbox. Click the link in it once; from then on, every message is delivered.
- The form shows success only after the service confirms delivery. If it refuses (for example, before activation), its message is shown instead.
- To use another service or the included Go server (`server/`), set `VITE_CONTACT_ENDPOINT` (or the `CONTACT_ENDPOINT` repository variable) to its URL.

---
