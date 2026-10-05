# HANDOFF — Portfolio 2026 refresh

## Current Goal
2026 portfolio on `feature/portfolio-2026-refresh`, ready for review/merge to `main`.

## State
- Project-based data (`public/data/portfolio.json`, version 2): 53 projects — 28 published, 18 archived (kept, hidden), 7 assets_pending.
- All 81 legacy images reviewed by eye; every image is assigned to exactly one project.
- WebP derivatives in `public/assets/web/` (960 px + full/1920 px). Originals untouched in `public/assets/portfolio/`.
- QA: 320/375/390/430/768/1024/1440/1920 × light/dark × all routes — 0 console errors, 0 broken images, 0 horizontal overflow.

## Decisions
- Corrections from image review: flyer-002 ↔ flyer-004 were swapped (002 = Kin no Inaho rice pack, 004 = JICA infographic); menu-002..004 → HIKARU; menu-007..012 → Shangri-La (ramen mark matches logotype-010); menu-013 → MENYA GENTO; menu-015 → AJISEN; book-001 client is Cambodia Business Partners (PPCBank = back-cover ad).
- Year only where printed on artwork (AEON 2018, Agri Tourism Festival 2017). Regions only where address/name states it.
- Grid: 2 columns, uniform 4:3 frames with `object-fit: contain` (no crop). Mobile: natural ratio.
- Hidden (archived): RYOMA, Shake's Cafe, TagCast, Karaoke SURVI Bar, single logos with low portfolio weight, single cards, unknown editorial spread.

## UNKNOWN (not guessed)
- Year for all other projects. Regions for Shangri-La, HIKARU, SAKANA LAB, MENYA GENTO, AJISEN, Ninja, SHIN-YA, UG, CamiYui and logo-only projects.
- book-004 client/publication. Roast'n'Roll relation to Chadajima (artboard header says Chadajima).

## Remaining / Next
- Add Ringer Hut assets → follow README "Publishing a pending project" (order 0 already reserved to lead).
- Same for Ootoya, CIMA, Volante, Cow Sticker, Food Package, Ecology Package.
- Hiroki to confirm years/regions if they should be shown.
