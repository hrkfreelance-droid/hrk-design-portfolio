import { projects, categories, getProject, getCategory, neighbours, coverOf, imageAttrs } from "./data.js";
import { renderQR } from "./qr.js";

const TELEGRAM = "hiroki_pp";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const pad = (n, size = 2) => String(n).padStart(size, "0");
const typeLine = (project) => project.types.join(" / ");
const fileCount = (list) => list.reduce((sum, project) => sum + project.assets.length, 0);

// One square = one item. The site's counting device.
export function marks(count, active = -1) {
  const items = Array.from({ length: count }, (_, i) => `<i${i === active ? ' class="on"' : ""}></i>`).join("");
  return `<span class="marks" aria-hidden="true">${items}</span>`;
}

function img(asset, { alt, sizes, eager = false }) {
  const { src, srcset } = imageAttrs(asset);
  const dims = asset.width && asset.height ? ` width="${asset.width}" height="${asset.height}"` : "";
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ""}${dims} alt="${esc(alt)}" loading="${
    eager ? "eager" : "lazy"
  }" decoding="async" />`;
}

/* ---------------------------------------------------------------- index */

export function renderIndex() {
  const total = fileCount(projects);
  const rows = categories
    .map(
      (c) => `
      <li>
        <a class="index-row" href="#/category/${c.id}">
          <span class="no">${pad(c.number)}</span>
          <span class="label">${esc(c.label)}</span>
          ${marks(c.projects.length)}
          <span class="count">${pad(c.projects.length)}</span>
        </a>
      </li>`
    )
    .join("");

  return {
    spine: `hrk_design — Index — ${pad(categories.length)} categories / ${pad(projects.length)} projects / ${pad(total)} files`,
    html: `
    <section class="index">
      <div class="index-aside">
        <h1 id="page-title" class="micro" tabindex="-1">Index</h1>
        <p class="index-lede">Selected graphic design,<br />organised by category.</p>
        <dl class="stats">
          <div><dt>Categories</dt><dd>${pad(categories.length)}</dd></div>
          <div><dt>Projects</dt><dd>${pad(projects.length)}</dd></div>
          <div><dt>Files</dt><dd>${pad(total)}</dd></div>
        </dl>
        <p class="legend">${marks(1)}<span>= 1 project</span></p>
      </div>

      <nav class="index-main" aria-label="Categories">
        <ol class="index-list">
          ${rows}
          <li class="index-all">
            <a class="index-row" href="#/category/all">
              <span class="no">00</span>
              <span class="label">All projects</span>
              <span class="marks" aria-hidden="true"></span>
              <span class="count">${pad(projects.length)}</span>
            </a>
          </li>
        </ol>
      </nav>
    </section>`,
  };
}

/* ------------------------------------------------------------- category */

function categorySwitch(activeId) {
  const items = categories
    .map(
      (c) =>
        `<a href="#/category/${c.id}" title="${esc(c.label)}"${c.id === activeId ? ' aria-current="page"' : ""}><span class="sr-only">${esc(
          c.label
        )} </span>${pad(c.number)}</a>`
    )
    .join("");
  return `<nav class="switch" aria-label="Other categories">${items}<a href="#/category/all" title="All projects"${
    activeId === "all" ? ' aria-current="page"' : ""
  }><span class="sr-only">All projects </span>00</a></nav>`;
}

export function renderCategory(id) {
  const all = id === "all";
  const category = all
    ? { id: "all", number: 0, label: "All projects", description: "Every published project, in order.", projects }
    : getCategory(id);
  if (!category) return renderNotFound();

  const list = category.projects;
  const rows = list
    .map(
      (p) => `
      <li>
        <a class="prow" href="#/project/${esc(p.id)}" data-project="${esc(p.id)}" data-from="${category.id}">
          <span class="no">${pad(p.number, 3)}</span>
          <span class="name">${esc(p.title)}</span>
          <span class="type">${esc(typeLine(p))}</span>
          <span class="region">${esc((p.regions || []).join(" / "))}</span>
          <span class="files">${pad(p.assets.length)}</span>
        </a>
      </li>`
    )
    .join("");

  return {
    spine: `Index / ${pad(category.number)} ${category.label} — ${pad(list.length)} projects`,
    html: `
    <section class="category">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><span>${pad(category.number)}</span></p>
        <h1 id="page-title" tabindex="-1">${esc(category.label)}</h1>
        <p class="head-note">${esc(category.description || "")}</p>
        ${categorySwitch(category.id)}
      </header>

      <div class="category-body">
        <div class="plist-wrap${list.some((p) => p.regions?.length) ? "" : " no-region"}">
          <div class="plist-head" aria-hidden="true">
            <span>No.</span><span>Project</span><span>Type</span><span>Region</span><span>Files</span>
          </div>
          <ol class="plist">${rows}</ol>
          <p class="plist-foot">${pad(list.length)} projects — ${pad(fileCount(list))} files</p>
        </div>
        <aside class="preview" aria-hidden="true" data-preview>
          <div class="preview-frame" data-preview-frame></div>
          <p class="preview-meta" data-preview-meta></p>
        </aside>
      </div>
    </section>`,
  };
}

// Hover / focus preview for the project list (desktop only, via CSS).
export function mountCategory(root) {
  const panel = root.querySelector("[data-preview]");
  if (!panel) return;
  const frame = panel.querySelector("[data-preview-frame]");
  let image = null;
  const meta = panel.querySelector("[data-preview-meta]");
  let current = null;

  const show = (row) => {
    const project = getProject(row.dataset.project);
    if (!project || current === project.id) return;
    current = project.id;
    const cover = coverOf(project);
    const { src, srcset } = imageAttrs(cover);
    panel.classList.remove("is-on");
    if (!image) {
      image = document.createElement("img");
      image.alt = "";
      frame.appendChild(image);
    }
    image.onload = () => current === project.id && panel.classList.add("is-on");
    image.srcset = srcset;
    image.sizes = "320px";
    image.src = src;
    if (image.complete && image.naturalWidth) panel.classList.add("is-on");
    meta.innerHTML = `<span>${pad(project.number, 3)}</span><span>${esc(project.title)}</span>${marks(
      project.assets.length,
      project.cover ?? 0
    )}`;
  };
  const hide = () => {
    current = null;
    panel.classList.remove("is-on");
  };

  root.querySelectorAll(".prow").forEach((row) => {
    row.addEventListener("pointerenter", () => show(row));
    row.addEventListener("focus", () => show(row));
  });
  root.querySelector(".plist")?.addEventListener("pointerleave", hide);
  root.querySelector(".plist")?.addEventListener("focusout", (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) hide();
  });
}

/* -------------------------------------------------------------- project */

const ratio = (a) => (a.width && a.height ? a.height / a.width : 0.75);
const isTall = (a) => ratio(a) > 0.85;

// Editorial layout: deterministic sequence, never random.
// Landscape pieces alternate full / offset; tall pieces pair up (every other
// pair staggered) or sit alone in a narrow column that alternates sides.
function layout(assets) {
  const rows = [];
  let wide = 0;
  let pair = 0;
  let solo = 0;
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    const b = assets[i + 1];
    if (isTall(a) && b && isTall(b)) {
      rows.push({ kind: pair++ % 2 ? "pair stagger" : "pair", items: [i, i + 1] });
      i++;
    } else if (isTall(a)) {
      rows.push({ kind: solo++ % 2 ? "solo right" : "solo", items: [i] });
    } else {
      rows.push({ kind: i === 0 || wide % 2 === 0 ? "wide" : "wide offset", items: [i] });
      wide++;
    }
  }
  return rows;
}

export function projectContext(project, from) {
  if (from === "all") return { id: "all", number: 0, label: "All projects" };
  const category = getCategory(from) && project.categories.includes(from) ? getCategory(from) : getCategory(project.categories[0]);
  return category || { id: "all", number: 0, label: "All projects" };
}

export function renderProject(id, from) {
  const project = getProject(id);
  if (!project) return renderNotFound();

  const context = projectContext(project, from);
  const { prev, next } = neighbours(id, context.id === "all" ? null : context.id);
  const total = project.assets.length;

  const figure = (i, sizes) => {
    const asset = project.assets[i];
    const label = [asset.type, asset.caption].filter(Boolean).join(" — ");
    return `
      <figure class="art">
        <button class="art-open" type="button" data-open="${i}" aria-label="View ${esc(project.title)}, file ${i + 1} of ${total}, full screen">
          ${img(asset, { alt: `${project.title} — ${label || "artwork"}`, sizes, eager: i === 0 })}
        </button>
        <figcaption><span class="no">${pad(i + 1)}/${pad(total)}</span><span>${esc(asset.type || "")}</span>${
          asset.caption ? `<span class="cap">${esc(asset.caption)}</span>` : ""
        }</figcaption>
      </figure>`;
  };

  const gallery = layout(project.assets)
    .map((row) => {
      const sizes = row.kind.startsWith("pair")
        ? "(min-width: 900px) 42vw, 100vw"
        : row.kind.startsWith("solo")
          ? "(min-width: 900px) 40vw, 100vw"
          : "(min-width: 1440px) 1200px, 100vw";
      return `<div class="row ${row.kind}">${row.items.map((i) => figure(i, sizes)).join("")}</div>`;
    })
    .join("");

  const meta = [
    ["Client", project.client],
    ["Type", typeLine(project)],
    ["Region", (project.regions || []).join(" / ")],
    ["Year", project.year],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join("");

  return {
    spine: `${pad(context.number)} ${context.label} / ${pad(project.number, 3)} ${project.title} — ${pad(total)} files`,
    html: `
    <article class="project">
      <header class="page-head project-head">
        <p class="crumbs">
          <a href="#/">Index</a><span>/</span>
          <a href="#/category/${context.id}">${pad(context.number)} ${esc(context.label)}</a><span>/</span>
          <span>${pad(project.number, 3)}</span>
        </p>
        <h1 id="page-title" tabindex="-1"><span class="no">${pad(project.number, 3)}</span>${esc(project.title)}</h1>
        <dl class="meta">${meta}<div><dt>Files</dt><dd>${pad(total)} ${marks(total)}</dd></div></dl>
      </header>

      <div class="gallery">${gallery}</div>

      <nav class="pager" aria-label="More in ${esc(context.label)}">
        <a href="#/project/${esc(prev.id)}" data-from="${context.id}">
          <span class="micro">← Prev / ${pad(prev.number, 3)}</span><span>${esc(prev.title)}</span>
        </a>
        <a href="#/category/${context.id}" class="pager-up" data-from="${context.id}">
          <span class="micro">↑ ${pad(context.number)}</span><span>${esc(context.label)}</span>
        </a>
        <a href="#/project/${esc(next.id)}" data-from="${context.id}">
          <span class="micro">${pad(next.number, 3)} / Next →</span><span>${esc(next.title)}</span>
        </a>
      </nav>
    </article>`,
  };
}

/* ---------------------------------------------------------------- about */

export function renderAbout() {
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  return {
    spine: "About — hrk_design / Hiroki Toyoshima",
    html: `
    <section class="plain">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><span>About</span></p>
        <h1 id="page-title" tabindex="-1">Hiroki Toyoshima</h1>
        <p class="head-note">Graphic Designer based in Phnom Penh.</p>
      </header>
      <div class="plain-body">
        <p>Most of the work is for restaurants, food brands and retail — menus, packaging, signage and the identities behind them — alongside print and editorial work for companies and organisations.</p>
      </div>
      <dl class="facts">
        <div><dt>Working across</dt><dd>${list(["Branding", "Print", "Menu", "Signage", "Packaging", "Digital / Web"])}</dd></div>
        <div><dt>Regions</dt><dd>${list(["Cambodia", "Thailand", "Vietnam", "Japan"])}</dd></div>
        <div><dt>Based in</dt><dd>Phnom Penh, Cambodia</dd></div>
        <div><dt>Contact</dt><dd><a class="text-link" href="#/contact">Telegram / @${TELEGRAM}</a></dd></div>
      </dl>
    </section>`,
  };
}

/* -------------------------------------------------------------- contact */

export function renderContact() {
  return {
    spine: "Contact — Telegram / @" + TELEGRAM,
    html: `
    <section class="plain">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><span>Contact</span></p>
        <h1 id="page-title" tabindex="-1">Contact</h1>
      </header>
      <dl class="facts">
        <div><dt>Telegram</dt><dd><a class="text-link" href="https://t.me/${TELEGRAM}" target="_blank" rel="noopener">@${TELEGRAM} ↗</a></dd></div>
        <div><dt>QR</dt><dd><div class="qr" data-qr></div></dd></div>
      </dl>
    </section>`,
  };
}

export function mountContact(root) {
  const el = root.querySelector("[data-qr]");
  if (el) renderQR(el, `https://t.me/${TELEGRAM}`);
}

/* ------------------------------------------------------------------ 404 */

export function renderNotFound() {
  return {
    spine: "404 — Not found",
    html: `
    <section class="plain">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><span>404</span></p>
        <h1 id="page-title" tabindex="-1">Not found</h1>
        <p class="head-note"><a class="text-link" href="#/">Back to index</a></p>
      </header>
    </section>`,
  };
}
