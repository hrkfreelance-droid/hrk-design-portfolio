export let works = [];
export let projects = [];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function known(value) {
  return value && value !== "unknown";
}

function buildProjects(items) {
  const grouped = new Map();

  items.forEach((work, index) => {
    const hasClient = known(work.client);
    const title = hasClient ? work.client : (known(work.title) ? work.title : work.type);
    const groupKey = hasClient ? `client:${work.client}` : `work:${work.id}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        id: hasClient ? slugify(work.client) || work.id : work.id,
        title,
        client: hasClient ? work.client : "unknown",
        types: [],
        categories: [],
        years: [],
        images: [],
        sourceOrder: index,
      });
    }

    const project = grouped.get(groupKey);
    if (known(work.type) && !project.types.includes(work.type)) project.types.push(work.type);
    if (known(work.category) && !project.categories.includes(work.category)) project.categories.push(work.category);
    if (known(work.year) && !project.years.includes(work.year)) project.years.push(work.year);
    project.images.push({
      id: work.id,
      src: work.image,
      type: work.type,
      title: work.title,
    });
  });

  const usedIds = new Set();
  return Array.from(grouped.values())
    .sort((a, b) => a.sourceOrder - b.sourceOrder)
    .map((project) => {
      let id = project.id || `project-${project.sourceOrder + 1}`;
      let suffix = 2;
      while (usedIds.has(id)) id = `${project.id}-${suffix++}`;
      usedIds.add(id);
      return { ...project, id };
    });
}

export async function loadData() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/portfolio.json`);
  const json = await res.json();
  works = json.works;
  projects = buildProjects(works);
  return projects;
}

export function getProject(id) {
  return projects.find((project) => project.id === id);
}

export function nextProject(id) {
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return projects[0];
  return projects[(index + 1) % projects.length];
}
