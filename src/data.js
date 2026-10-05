// Project data lives in public/data/portfolio.json. A project is one record
// with many assets; categories are only entry points into the same projects.
// Only published + visible projects with at least one asset are rendered, and
// a category is listed only while it contains at least one of them.

const BASE = import.meta.env.BASE_URL;

export let projects = [];
export let categories = [];

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
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.sourceIndex - b.sourceIndex)
    .map((project, index) => ({ ...project, number: index + 1 }));

  categories = (json.categories || [])
    .map((category) => ({
      ...category,
      projects: projects.filter((project) => (project.categories || []).includes(category.id)),
    }))
    .filter((category) => category.projects.length > 0)
    .map((category, index) => ({ ...category, number: index + 1 }));
}

export const getProject = (id) => projects.find((project) => project.id === id);
export const getCategory = (id) => categories.find((category) => category.id === id);

// The list a project is being browsed in: its category when known, else everything.
export function listFor(categoryId) {
  return getCategory(categoryId)?.projects || projects;
}

export function neighbours(id, categoryId) {
  const list = listFor(categoryId);
  const index = list.findIndex((project) => project.id === id);
  const count = list.length;
  return {
    prev: list[(index - 1 + count) % count],
    next: list[(index + 1) % count],
  };
}

export function coverOf(project) {
  return project.assets[project.cover ?? 0] || project.assets[0];
}

function webUrl(asset, width) {
  const stem = asset.src.replace(/^assets\/portfolio\//, "").replace(/\.[a-z0-9]+$/i, "");
  return `${BASE}assets/web/${stem}-${width}.webp`;
}

// Responsive image attributes. Falls back to the original file when no web
// derivatives exist yet (see scripts/optimize_images.py).
export function imageAttrs(asset) {
  const widths = Array.isArray(asset.web) ? asset.web : [];
  if (!widths.length) return { src: `${BASE}${asset.src}`, srcset: "" };
  return {
    src: webUrl(asset, widths[0]),
    srcset: widths.map((w) => `${webUrl(asset, w)} ${w}w`).join(", "),
  };
}

// Largest derivative for the viewer, plus the untouched original for deep zoom.
export function viewerSources(asset) {
  const widths = Array.isArray(asset.web) ? asset.web : [];
  const original = `${BASE}${asset.src}`;
  return {
    display: widths.length ? webUrl(asset, widths[widths.length - 1]) : original,
    original,
  };
}
