export let works = [];
export let categories = [];

export async function loadData() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/portfolio.json`);
  const json = await res.json();
  works = json.works;
  categories = Array.from(new Set(works.map((w) => w.category)));
  return works;
}

export function getWork(id) {
  return works.find((w) => w.id === id);
}

export function nextWork(id) {
  const i = works.findIndex((w) => w.id === id);
  return works[(i + 1) % works.length];
}
