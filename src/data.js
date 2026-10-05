// Project data lives in public/data/portfolio.json (one record per project,
// each with multiple assets). Only published + visible projects that have at
// least one asset are rendered; everything else stays as management data.

const BASE = import.meta.env.BASE_URL;

export let projects = [];

function isPublic(project) {
  return (
    project.visible === true &&
    project.status === "published" &&
    Array.isArray(project.assets) &&
    project.assets.length > 0
  );
}

export async function loadData() {
  const res = await fetch(`${BASE}data/portfolio.json`);
  if (!res.ok) throw new Error(`portfolio.json: ${res.status}`);
  const json = await res.json();

  projects = json.projects
    .map((project, sourceIndex) => ({ ...project, sourceIndex }))
    .filter(isPublic)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.sourceIndex - b.sourceIndex);

  return projects;
}

export function getProject(id) {
  return projects.find((project) => project.id === id);
}

export function neighbours(id) {
  const index = projects.findIndex((project) => project.id === id);
  const count = projects.length;
  return {
    index,
    prev: projects[(index - 1 + count) % count],
    next: projects[(index + 1) % count],
  };
}

export function coverOf(project) {
  return project.assets[project.cover ?? 0] || project.assets[0];
}

// Responsive image attributes for an asset. Falls back to the original file
// when no web derivatives have been generated yet (see scripts/optimize_images.py).
export function imageAttrs(asset) {
  const original = `${BASE}${asset.src}`;
  const widths = Array.isArray(asset.web) ? asset.web : [];
  if (!widths.length) return { src: original, srcset: "" };

  const stem = asset.src.replace(/^assets\/portfolio\//, "").replace(/\.[a-z0-9]+$/i, "");
  const url = (w) => `${BASE}assets/web/${stem}-${w}.webp`;
  return {
    src: url(widths[0]),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(", "),
  };
}
