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

## How the GitHub data works

```
GitHub Action (daily + on push)                         Visitor's browser
───────────────────────────────                          ─────────────────
scripts/fetch-github.mjs ──► public/data/github.json ──► loads the snapshot first
   uses GITHUB_TOKEN (server-side only)                  │ if missing → live public API (no auth)
   full repo scan, manifests, GraphQL calendar           │ cached 30 min in localStorage
                                                         └ on failure → last cached copy + notice
```

Both paths use the same collector (`shared/collect.js`), so the data shape is identical. All responses are validated and sanitised (`src/services/github/validate.ts`) before rendering. Private repositories are never requested. Only `/users/<name>/repos` (public only) is used, and anything flagged private is dropped.

### What each metric means

| Metric | Definition | Limitations |
| --- | --- | --- |
| **Commits authored across public GitHub** | GitHub commit search: commits whose author is linked to your account, on default branches of public repos. Shown for the last 30 days, last 12 months and all history. Each commit is counted once. | Commits made with an email not linked to your account aren't counted. GitHub may flag results as incomplete; the site then marks the number as a lower bound. |
| **Commits in my own repositories** *(build only)* | Every commit you authored on the default branch of your non-fork public repos, **de-duplicated by SHA** across repositories. | Default branches only. A scan of more than 3,000 commits per repo is capped and marked "+". |
| **Pushes** | Count of `PushEvent`s in your public event stream, with the exact date window shown. | **Estimate.** GitHub keeps about 90 days and 300 events. It is never presented as a lifetime total. Commits per push are left blank when GitHub omits them from the event payload. |
| **Contribution landscape** | With a token (in the Action), GitHub's public contribution calendar for the last 12 months. Without one, public events (pushes, PRs, issues, new repos) for the last ~90 days. | The source and window are printed under the chart. |
| **Contributors per project** | GitHub's contributors list for each repository: who committed to the default branch and how many commits each person made. Shown on project cards and in the project details. | For forks, the upstream project's contributors are included. In live mode, lists missing from the first load are fetched when you open a project. |
| **Stars / forks** | Sums across all public repositories you own. | — |
| **Languages** | GitHub's byte counts per repository. A language counts for a repository only at ≥5% of its code and ≥1.5 KB. Percentages are shares of code volume, **not proficiency**. | In live mode, byte stats load for up to 45 repos (rate-limit budget); the rest use their primary language, and the page says so. |
| **Technologies** | Inferred from evidence: dependency files (`package.json`, `go.mod`, `requirements.txt`), project files (`Dockerfile`, workflows, `*.vue`, `.xcodeproj` …) and repo topics. Each item shows its evidence. | File and dependency scanning runs in the Action. Live mode uses topics only. Edit the mapping in `shared/tech-map.json`. |

Refresh the snapshot locally:

```bash
GITHUB_TOKEN=<optional-token> GH_USERNAME=<your-username> npm run data
```

`public/data/github.json` is generated. Don't edit it by hand; it is regenerated on every deploy.

---

## The skeleton X‑ray reveal

- The player model and the skeleton model are **two real 3D models on one shared rig**. The skeleton parts are children of the same head, body, arm and leg pivots. Pose, animation, head-tracking and camera are always identical, and the skeleton sits slightly inside the skin.
- Both use Three.js materials patched with `onBeforeCompile` (`src/three/reveal.ts`). For each fragment, the shader computes the screen-space distance from `gl_FragCoord` to the cursor:
  - **skin** fragments inside the circle are discarded, with a soft, pixel-dithered edge and a glowing rim;
  - **skeleton** fragments outside the circle are discarded, using the complementary dither, so the two blend exactly.
- Only character materials take part, so the world behind is never affected. The reveal follows the cursor with damping. It grows only while a ray from the cursor hits the character's geometry, and shrinks back to nothing when the cursor leaves.
- **Touch / keyboard:** tap the character to reveal at that point, or use the **X‑ray vision** button for an automatic sweep.

---

## Performance & accessibility

- **Phones and low-end devices** get a lighter 3D world automatically. It turns on for touch screens, small screens, devices with 4 GB of memory or less or 4 CPU cores or fewer, and Data Saver. Lite mode has no shadows or anti-aliasing, renders at lower resolution, generates fewer blocks, plants and particles, and uses fewer lights. It renders at 30 fps on the hero and 15 fps behind other sections. Choose **⚙ → Graphics → Fancy** to force the full world, or turn 3D off.

- The 3D engine and Three.js are **lazy-loaded** after first paint, in a separate chunk. Content is readable before the world loads.
- Instanced meshes (one per block type, faces merged per material), hidden-block culling, ~25 draw calls for the whole island. All GPU resources are disposed on teardown.
- **Auto quality** adjusts resolution to keep frame rate up. The ⚙ menu offers *Fancy / Fast*, a **3D on/off switch** (static backdrop and 2D character portrait instead), and **Motion: System / Full / Reduced**. `prefers-reduced-motion` is respected.
- WebGL-unsupported browsers and lost GL contexts fall back to the static backdrop automatically.
- Keyboard: **1–9** jump to hotbar sections, skip link, visible focus states, focus-trapped dialogs with <kbd>Esc</kbd>, accessible tabs, ARIA labels on charts.
- Responsive from 320 px phones to wide desktops, with no horizontal page scroll.

---

## Project structure

```
.github/workflows/deploy.yml   Build + daily refresh + Pages deploy
scripts/fetch-github.mjs       Build-time GitHub snapshot (token stays server-side)
scripts/generate-textures.mjs  Skin / skeleton / cape pixel-art generator
shared/collect.js              One GitHub collector used by the browser and the Action
shared/detect.js               Technology detection rules
shared/tech-map.json           Dependency / file / topic → technology mapping
server/                        Optional Go contact-form backend
src/config/site.ts             ← your content
src/content/posts/*.md         ← your articles
src/three/                     3D engine: world, player rig, reveal shader, textures
src/services/github/           Data loading, validation, derived statistics
src/components/sections/       Portfolio sections
src/components/layout/         World backdrop, top bar, hotbar, footer
public/skin.png                ← your skin
public/cv.pdf                  ← your CV (add it)
```

---

## Troubleshooting

- **"No GitHub username is configured"**: set `githubUsername` in `site.ts`, or `VITE_GITHUB_USERNAME`, or deploy with the Action, which uses the repo owner.
- **Rate limit message locally**: unauthenticated requests allow 60 per hour per IP. Run `npm run data` with a token to create a local snapshot.
- **Character looks wrong**: make sure `public/skin.png` is a 64×64 skin. Older 64×32 skins lack separate left limbs.

Minecraft is a trademark of Mojang Studios. This project is fan-made, uses only original artwork, and is not affiliated with Mojang or Microsoft.
