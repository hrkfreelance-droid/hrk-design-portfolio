# hrk_design — Hiroki Toyoshima Portfolio

Live: https://hrkfreelance-droid.github.io/hrk-design-portfolio/

Minimal, editorial, typography-driven portfolio rebuilt from the original Adobe Portfolio
site. Static Vite + vanilla JS site with GSAP-driven motion, dark mode, and a locally
generated QR code for contact.

## Stack

- Vite (vanilla JS, no framework)
- GSAP + ScrollTrigger for scroll-linked hero motion
- `qrcode` for local QR generation (no third-party image service)

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Data

Work items live in [`public/data/portfolio.json`](public/data/portfolio.json), generated
from the source Adobe Portfolio site. Images are in `public/assets/portfolio/<category>/`.
Client/type fields are marked `"unknown"` where they could not be confirmed from the
original site or the artwork itself.

## Deployment

Deploys automatically to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
on every push to `main`.
