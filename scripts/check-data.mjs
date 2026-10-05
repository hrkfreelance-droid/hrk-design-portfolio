// Validates public/data/portfolio.json before build.
// Run: npm run check
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const data = JSON.parse(readFileSync(join(pub, "data/portfolio.json"), "utf8"));

const errors = [];
const ids = new Set();
const categoryIds = new Set((data.categories || []).map((c) => c.id));
if (!categoryIds.size) errors.push("no categories defined");
const STATUSES = new Set(["published", "archived", "assets_pending"]);

for (const p of data.projects) {
  const where = `project "${p.id}"`;
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) errors.push(`${where}: id must be kebab-case`);
  if (ids.has(p.id)) errors.push(`${where}: duplicate id`);
  ids.add(p.id);
  if (!p.title) errors.push(`${where}: missing title`);
  if (!STATUSES.has(p.status)) errors.push(`${where}: unknown status "${p.status}"`);
  if (typeof p.order !== "number") errors.push(`${where}: order must be a number`);
  if (!Array.isArray(p.assets)) errors.push(`${where}: assets must be an array`);
  if (!Array.isArray(p.categories) || !p.categories.length) errors.push(`${where}: needs at least one category`);
  for (const c of p.categories || []) if (!categoryIds.has(c)) errors.push(`${where}: unknown category "${c}"`);
  if (p.visible && p.status !== "published") errors.push(`${where}: visible but status is "${p.status}"`);
  if (p.visible && !p.assets?.length) errors.push(`${where}: visible but has no assets`);
  if ((p.regions || []).includes("unknown")) errors.push(`${where}: use [] instead of "unknown" region`);
  if (p.year === "unknown") errors.push(`${where}: use null instead of "unknown" year`);

  for (const a of p.assets || []) {
    if (!existsSync(join(pub, a.src))) errors.push(`${where}: missing file ${a.src}`);
    if (p.visible && !(a.width && a.height)) errors.push(`${where}: ${a.src} has no width/height (run scripts/optimize_images.py)`);
    for (const w of a.web || []) {
      const stem = a.src.replace(/^assets\/portfolio\//, "").replace(/\.[a-z0-9]+$/i, "");
      const file = join(pub, "assets/web", `${stem}-${w}.webp`);
      if (!existsSync(file)) errors.push(`${where}: missing derivative ${stem}-${w}.webp`);
    }
  }
}

const visible = data.projects.filter((p) => p.visible);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`portfolio.json OK — ${data.projects.length} projects, ${visible.length} visible`);
