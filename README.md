# hrk_design — Hiroki Toyoshima Portfolio

Live: https://hrkfreelance-droid.github.io/hrk-design-portfolio/

An index, not a showcase. Static Vite + vanilla JS, no framework.
Light by default, optional dark theme. Fonts (Inter, IBM Plex Mono) are self-hosted via @fontsource.

Structure — three levels, then a viewer:

| Route | Shows |
| --- | --- |
| `#/` | Index: categories only, one square per project. No artwork. |
| `#/category/<id>` (`all` = every project) | Project list: No. / project / type / region / files, small hover preview. |
| `#/project/<id>` | Small header, artwork set editorially (wide / offset / pair / staggered / narrow). |
| click an artwork | Full-screen viewer: zoom, pan, pinch, double-tap, swipe, ← → Esc + − 0. |

Visual language: one square = one item (projects, files); the only colour is a red square that marks
the current position; the left spine carries each page's metadata.

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
  "categories": ["food", "menu", "signage"],  // ids from the top-level "categories" list
  "summary": null,               // optional 1–3 lines
  "cover": 0,                    // index of the asset used on the work list
  "assets": [
    { "src": "assets/portfolio/ringer-hut/menu-01.jpg", "type": "Menu", "caption": null }
  ]
}
```

Categories are defined once at the top of the file (`categories`) and are only entry points: a
project is one record and may sit in several categories. A category with no published project is
hidden automatically (e.g. `digital` appears once Ringer Hut's SNS / monitor work is published).

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
