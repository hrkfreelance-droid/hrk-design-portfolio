# hrk_design — Hiroki Toyoshima Portfolio

Live: https://hrkfreelance-droid.github.io/hrk-design-portfolio/

Quiet, editorial portfolio. Static Vite + vanilla JS, no framework.
Light by default, optional dark theme, hash routing (`#/`, `#/project/<id>`, `#/about`, `#/contact`).

## Development

```bash
npm ci
npm run dev       # http://localhost:5173/
npm run build     # validates data, then builds to dist/
npm run preview   # http://localhost:4173/hrk-design-portfolio/
```

## Data — `public/data/portfolio.json`

One record per **project** (client / brand), each with **multiple assets**.

```jsonc
{
  "id": "ringer-hut",            // kebab-case, used in the URL
  "title": "Ringer Hut",
  "client": "Ringer Hut",        // null if unknown — never guessed
  "status": "published",         // published | archived | assets_pending
  "visible": true,               // only visible + published + ≥1 asset is rendered
  "featured": true,
  "order": 1,                    // ascending; no random order
  "year": null,                  // only when confirmed
  "regions": ["Cambodia"],       // only when confirmed, [] otherwise
  "types": ["Menu", "Signage"],
  "summary": null,               // optional 1–3 lines
  "cover": 0,                    // index of the asset used on the work list
  "assets": [
    { "src": "assets/portfolio/ringer-hut/menu-01.jpg", "type": "Menu", "caption": null }
  ]
}
```

Unknown facts stay `null` / `[]` and are simply not shown on the site.
`note` fields record why data was corrected; they are not rendered.

### Publishing a pending project (e.g. Ringer Hut)

1. Add images under `public/assets/portfolio/<project-id>/`.
2. Add them to the project's `assets` (src, type, optional caption).
3. Run `pip install pillow && python3 scripts/optimize_images.py`
   — writes WebP derivatives to `public/assets/web/` and fills `width` / `height`.
4. Set `"status": "published"`, `"visible": true`, and an `order` (e.g. `1` to lead).
5. `npm run build` (runs `scripts/check-data.mjs`).

Originals are never modified; derivatives are resize + WebP only (no crop, no colour change).

## History

- `data/portfolio.legacy.json` — original per-image data from the Adobe Portfolio import (kept for reference).
- `data/projects.pending.legacy.json` — original pending list (merged into `portfolio.json`).

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
`portfolio-ci.yml` builds the refresh branch and PRs to `main`.
