import { projects, getProject, neighbours, coverOf, imageAttrs } from "./data.js";
import { renderQR } from "./qr.js";

const TELEGRAM = "hiroki_pp";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const pad = (n, size = 2) => String(n).padStart(size, "0");
const files = (count) => `${pad(count)} ${count === 1 ? "FILE" : "FILES"}`;
const typeLine = (project) => project.types.join(" / ");

function img(asset, { alt, sizes, eager = false }) {
  const { src, srcset } = imageAttrs(asset);
  const dims = asset.width && asset.height ? `width="${asset.width}" height="${asset.height}"` : "";
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ""} ${dims}
    alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""} />`;
}

/* ------------------------------------------------------------------ work */

export function renderWork() {
  const items = projects
    .map((project, index) => {
      const cover = coverOf(project);
      return `
        <li class="work-item reveal">
          <a class="work-link" href="#/project/${esc(project.id)}">
            <div class="plate">
              ${img(cover, {
                alt: `${project.title} — ${cover.type || typeLine(project)}`,
                sizes: "(min-width: 760px) 46vw, 100vw",
                eager: index < 2,
              })}
            </div>
            <div class="work-caption">
              <span class="index">${pad(index + 1, 3)}</span>
              <span class="work-title">${esc(project.title)}</span>
              <span class="work-type">${esc(typeLine(project))}</span>
              <span class="work-files">${files(project.assets.length)}</span>
            </div>
          </a>
        </li>`;
    })
    .join("");

  return `
    <section class="intro" aria-labelledby="page-title">
      <p class="micro">PORTFOLIO / ${new Date().getFullYear()}</p>
      <h1 id="page-title" tabindex="-1">Hiroki Toyoshima</h1>
      <p class="intro-line">Graphic Designer / Phnom Penh</p>
      <p class="intro-line muted">Brand / Print / Menu / Signage / Digital</p>
    </section>

    <section class="work" aria-labelledby="work-heading">
      <header class="rule-head">
        <h2 id="work-heading">SELECTED WORK</h2>
        <span>${pad(projects.length)} PROJECTS</span>
      </header>
      <ol class="work-grid" role="list">${items}</ol>
    </section>`;
}

/* --------------------------------------------------------------- project */

function metaRows(project) {
  const rows = [
    ["CLIENT", project.client],
    ["TYPE", typeLine(project)],
    ["YEAR", project.year],
    ["REGION", (project.regions || []).join(" / ")],
    ["FILES", pad(project.assets.length)],
  ];
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`)
    .join("");
}

const isPortrait = (asset) => asset.width && asset.height && asset.height / asset.width > 0.85;

// Two consecutive portrait pieces sit side by side; everything else runs full width.
function galleryRows(assets) {
  const rows = [];
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    const b = assets[i + 1];
    if (isPortrait(a) && b && isPortrait(b)) {
      rows.push({ kind: "pair", items: [i, i + 1] });
      i++;
    } else {
      rows.push({ kind: isPortrait(a) ? "solo" : "full", items: [i] });
    }
  }
  return rows;
}

export function renderProject(id) {
  const project = getProject(id);
  if (!project) return renderNotFound();

  const { index, prev, next } = neighbours(id);
  const total = project.assets.length;

  const figure = (i, sizes) => {
    const asset = project.assets[i];
    const label = [asset.type, asset.caption].filter(Boolean).join(" — ");
    return `
      <figure class="figure">
        <div class="plate plate--detail">
          ${img(asset, { alt: `${project.title} — ${label || "Design"}`, sizes, eager: i === 0 })}
        </div>
        <figcaption>
          <span class="index">${pad(i + 1)} / ${pad(total)}</span>
          <span>${esc(asset.type || "")}</span>
          ${asset.caption ? `<span class="muted">${esc(asset.caption)}</span>` : ""}
        </figcaption>
      </figure>`;
  };

  const gallery = galleryRows(project.assets)
    .map((row) => {
      const sizes =
        row.kind === "pair" ? "(min-width: 760px) 46vw, 100vw" : row.kind === "solo" ? "(min-width: 760px) 60vw, 100vw" : "(min-width: 1400px) 1320px, 100vw";
      return `<div class="gallery-row gallery-row--${row.kind}">${row.items.map((i) => figure(i, sizes)).join("")}</div>`;
    })
    .join("");

  return `
    <article class="project">
      <header class="project-head">
        <a class="back" href="#/">← WORK</a>
        <p class="micro">${pad(index + 1, 3)} / ${pad(projects.length, 3)}</p>
        <h1 id="page-title" tabindex="-1">${esc(project.title)}</h1>
        ${project.summary ? `<p class="summary">${esc(project.summary)}</p>` : ""}
        <dl class="meta">${metaRows(project)}</dl>
      </header>

      <div class="gallery">${gallery}</div>

      <nav class="pager" aria-label="Projects">
        <a href="#/project/${esc(prev.id)}" class="pager-prev">
          <span class="micro">← PREV</span>
          <span>${esc(prev.title)}</span>
        </a>
        <a href="#/project/${esc(next.id)}" class="pager-next">
          <span class="micro">NEXT →</span>
          <span>${esc(next.title)}</span>
        </a>
      </nav>
    </article>`;
}

/* ----------------------------------------------------------------- about */

export function renderAbout() {
  const list = (items) => items.map((item) => `<li>${item}</li>`).join("");
  return `
    <section class="page">
      <p class="micro">ABOUT</p>
      <h1 id="page-title" tabindex="-1">Hiroki Toyoshima</h1>
      <div class="page-body">
        <p class="lead">Graphic designer based in Phnom Penh.</p>
        <p class="muted">Most of my work is for restaurants, food brands and retail — menus, packaging, signage and the identities behind them — alongside print and editorial work for companies and organisations.</p>
      </div>

      <dl class="facts">
        <div>
          <dt>WORKING ACROSS</dt>
          <dd><ul>${list(["Branding", "Print", "Menu", "Signage", "Packaging", "Digital / Web"])}</ul></dd>
        </div>
        <div>
          <dt>REGIONS</dt>
          <dd><ul>${list(["Cambodia", "Thailand", "Vietnam", "Japan"])}</ul></dd>
        </div>
        <div>
          <dt>BASED IN</dt>
          <dd>Phnom Penh, Cambodia</dd>
        </div>
        <div>
          <dt>CONTACT</dt>
          <dd><a class="text-link" href="#/contact">Telegram / @${TELEGRAM}</a></dd>
        </div>
      </dl>
    </section>`;
}

/* --------------------------------------------------------------- contact */

export function renderContact() {
  return `
    <section class="page">
      <p class="micro">CONTACT</p>
      <h1 id="page-title" tabindex="-1">Contact</h1>
      <dl class="facts">
        <div>
          <dt>TELEGRAM</dt>
          <dd><a class="text-link" href="https://t.me/${TELEGRAM}" target="_blank" rel="noopener">@${TELEGRAM} ↗</a></dd>
        </div>
        <div>
          <dt>QR</dt>
          <dd><div class="qr" data-qr></div></dd>
        </div>
      </dl>
    </section>`;
}

export function mountContact(root) {
  const el = root.querySelector("[data-qr]");
  if (el) renderQR(el, `https://t.me/${TELEGRAM}`);
}

/* ------------------------------------------------------------------- 404 */

export function renderNotFound() {
  return `
    <section class="page">
      <p class="micro">404</p>
      <h1 id="page-title" tabindex="-1">Not found</h1>
      <p><a class="text-link" href="#/">← Back to work</a></p>
    </section>`;
}
