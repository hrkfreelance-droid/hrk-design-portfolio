import { works, categories, getWork, nextWork } from "./data.js";
import { renderQR } from "./qr.js";
import { shuffle } from "./shuffle.js";

function splitChunks(text) {
  return text
    .split(" ")
    .map((word) => `<span class="chunk">${word}&nbsp;</span>`)
    .join("");
}

function sizeClass(index) {
  const pattern = ["size-lg", "size-md", "size-sm", "size-md", "size-sm", "size-lg"];
  return pattern[index % pattern.length];
}

export function renderHero() {
  return `
    <section class="hero" data-hero>
      <div class="hero-kicker">Hiroki<br>Toyoshima</div>
      <h1 class="hero-title">${splitChunks("hrk_design")}</h1>
      <div class="hero-meta">
        <span>graphic / digital / web</span>
        <span>phnom penh</span>
      </div>
      <a class="hero-scroll-cue" href="#/work">scroll — work ↓</a>
    </section>
  `;
}

function categoryNav(active) {
  const items = [
    { slug: "work", label: "ALL" },
    ...categories.map((c) => ({ slug: c, label: c.toUpperCase() })),
  ];
  return `
    <nav class="filters" aria-label="Category">
      ${items
        .map(
          (item) =>
            `<a href="#/${item.slug}" aria-current="${active === item.slug ? "page" : "false"}">${item.label}</a>`
        )
        .join("")}
    </nav>
  `;
}

function workGrid(list) {
  const items = list
    .map(
      (w, i) => `
      <div class="work-item reveal ${sizeClass(i)}" data-work-id="${w.id}" data-cursor-hover>
        <figure>
          <div class="work-frame">
            <img src="${import.meta.env.BASE_URL}${w.image}" alt="${w.client !== "unknown" ? w.client + " — " + w.type : w.type}" loading="lazy" width="1200" height="900" />
          </div>
          <figcaption class="work-caption">
            <span class="client">${w.client === "unknown" ? "unknown" : w.client}</span>
            <span>/</span>
            <span>${w.type}</span>
          </figcaption>
        </figure>
      </div>`
    )
    .join("");

  return `<div class="work-grid" data-work-grid>${items}</div>`;
}

// category: "work" for all, or one of the category slugs
export function renderCategory(category) {
  const list = category === "work" ? works : works.filter((w) => w.category === category);
  const shuffled = shuffle(list);
  return `
    <div class="category-page">
      ${categoryNav(category)}
      ${workGrid(shuffled)}
    </div>
  `;
}

export function renderProject(id) {
  const work = getWork(id);
  if (!work) return `<div class="page-simple"><h1>not found</h1></div>`;
  const next = nextWork(id);

  return `
    <div class="project-header">
      <dl class="project-meta">
        <div><dt>Client</dt><dd>${work.client === "unknown" ? "unknown" : work.client}</dd></div>
        <div><dt>Type</dt><dd>${work.type}</dd></div>
        <div><dt>Category</dt><dd>${work.category}</dd></div>
        <div><dt>Year</dt><dd>${work.year}</dd></div>
      </dl>
    </div>
    <div class="project-images">
      <img src="${import.meta.env.BASE_URL}${work.image}" alt="${work.client} — ${work.type}" loading="lazy" />
    </div>
    <a class="next-project" href="#/project/${next.id}">
      <span><small>Next Project</small>${next.client === "unknown" ? next.type : next.client}</span>
      <span>→</span>
    </a>
  `;
}

export function renderAbout() {
  return `
    <section class="page-simple">
      <h1>about</h1>
      <p>hrk_design is the graphic and digital design practice of Hiroki Toyoshima, based in Phnom Penh — working across flyers, menus, logotype, branding and web.</p>
    </section>
    <section class="page-simple">
      <h1 style="text-transform:none">CIJD</h1>
      <p>CIJD Co., Ltd. is a Japanese IT and service company working across digital, design, web, and practical business support. We connect ideas, technology and execution with a flexible, hands-on approach.</p>
      <p><a class="inline-link" href="https://www.facebook.com/cijdco" target="_blank" rel="noopener">facebook.com/cijdco</a></p>
    </section>
  `;
}

export function renderContact() {
  return `
    <section class="contact-page">
      <h1>contact</h1>
      <a class="contact-link" href="https://t.me/hiroki_pp" target="_blank" rel="noopener">Telegram — @hiroki_pp</a>
      <div class="qr-wrap" data-qr></div>
      <div class="qr-caption">scan to open telegram</div>
    </section>
  `;
}

export function mountContactExtras(root) {
  const qrEl = root.querySelector("[data-qr]");
  if (qrEl) renderQR(qrEl, "https://t.me/hiroki_pp");
}
