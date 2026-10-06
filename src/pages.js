import { projects, categories, clients, getProject, getCategory, getClient, neighbours, coverOf, imageAttrs } from "./data.js";
import { renderQR } from "./qr.js";
import { brand, isCijd } from "./brand.js";

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

function img(asset, { alt, sizes, eager = false }) {
  const { src, srcset } = imageAttrs(asset);
  const dims = asset.width && asset.height ? ` width="${asset.width}" height="${asset.height}"` : "";
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ""}${dims} alt="${esc(alt)}" loading="${
    eager ? "eager" : "lazy"
  }" decoding="async" />`;
}

/* ---------------------------------------------------------------- index */

export function renderIndex(mode = "category") {
  const clientMode = mode === "client";
  const rows = clientMode
    ? clients
        .map(
          (client) => `
      <li>
        <a class="index-row" href="#/client/${esc(client.id)}" data-client="${esc(client.id)}">
          <span class="no">${pad(client.number)}</span>
          <span class="label">${esc(client.name)}<span class="count"><span class="sr-only">, </span>${pad(client.projects.length)}<span class="sr-only"> ${client.projects.length === 1 ? "project" : "projects"}</span></span></span>
        </a>
      </li>`
        )
        .join("")
    : categories
        .map(
          (c) => `
      <li>
        <a class="index-row" href="#/category/${c.id}">
          <span class="no">${pad(c.number)}</span>
          <span class="label">${esc(c.label)}<span class="count"><span class="sr-only">, </span>${pad(c.projects.length)}<span class="sr-only">${c.projects.length === 1 ? " project" : " projects"}</span></span></span>
        </a>
      </li>`
        )
        .join("");

  return {
    spine: "Index",
    html: `
    <section class="index">
      <div class="index-aside">
        <h1 id="page-title" class="micro" tabindex="-1">Index</h1>
        <p class="index-lede">Graphic design<br /><span class="muted">Phnom Penh, Cambodia</span></p>
      </div>

      <nav class="index-main" aria-label="Browse by category or client">
        <div class="switch index-switch" aria-label="Browse by">
          <a href="#/"${!clientMode ? ' aria-current="page"' : ""}>Category</a>
          <a href="#/clients"${clientMode ? ' aria-current="page"' : ""}>Client</a>
        </div>
        <ol class="index-list" aria-label="${clientMode ? "Clients" : "Categories"}">
          ${rows}
          ${clientMode ? "" : `<li class="index-all">
            <a class="index-row" href="#/category/all">
              <span class="no">00</span>
              <span class="label">All projects<span class="count"><span class="sr-only">, </span>${pad(projects.length)}<span class="sr-only"> projects</span></span></span>
            </a>
          </li>`}
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
          <span class="files">${pad(p.assets.length)}</span>
        </a>
      </li>`
    )
    .join("");

  return {
    spine: `Index / ${pad(category.number)} ${category.label}`,
    html: `
    <section class="category">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><span>${pad(category.number)}</span></p>
        <h1 id="page-title" tabindex="-1">${esc(category.label)}</h1>
        ${categorySwitch(category.id)}
      </header>

      <div class="category-body">
        <div class="plist-wrap">
          <ol class="plist">${rows}</ol>
          <p class="plist-foot">${pad(list.length)} projects / ${pad(fileCount(list))} files</p>
        </div>
        <aside class="preview" aria-hidden="true" data-preview>
          <div class="preview-frame" data-preview-frame></div>
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
  let current = null;

  const show = (row) => {
    const project = row.dataset.project
      ? getProject(row.dataset.project)
      : getClient(row.dataset.client)?.projects[0];
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

export function renderClient(id) {
  const client = getClient(id);
  if (!client) return renderNotFound();

  const list = client.projects;
  const rows = list
    .map(
      (project) => `
      <li>
        <a class="prow" href="#/project/${esc(project.id)}" data-project="${esc(project.id)}" data-from="client:${esc(client.id)}">
          <span class="no">${pad(project.number, 3)}</span>
          <span class="name">${esc(project.title)}</span>
          <span class="type">${esc(typeLine(project))}</span>
          <span class="files">${pad(project.assets.length)}</span>
        </a>
      </li>`
    )
    .join("");

  return {
    spine: `Client / ${client.name}`,
    html: `
    <section class="category client-page">
      <header class="page-head">
        <p class="crumbs"><a href="#/">Index</a><span>/</span><a href="#/clients">Client</a><span>/</span><span>${esc(client.name)}</span></p>
        <h1 id="page-title" tabindex="-1">${esc(client.name)}</h1>
        <p class="client-count">${pad(list.length)} ${list.length === 1 ? "PROJECT" : "PROJECTS"}</p>
      </header>
      <div class="category-body">
        <div class="plist-wrap">
          <ol class="plist">${rows}</ol>
          <p class="plist-foot">${pad(list.length)} projects / ${pad(fileCount(list))} files</p>
        </div>
        <aside class="preview" aria-hidden="true" data-preview>
          <div class="preview-frame" data-preview-frame></div>
        </aside>
      </div>
    </section>`,
  };
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
  if (from?.startsWith("client:")) {
    const client = getClient(from.slice(7));
    if (client?.projects.some((item) => item.id === project.id)) {
      return { id: from, clientId: client.id, kind: "client", number: client.number, label: `CLIENT / ${client.name}` };
    }
  }
  const category = getCategory(from) && project.categories.includes(from) ? getCategory(from) : getCategory(project.categories[0]);
  return category ? { ...category, kind: "category" } : { id: "all", number: 0, label: "All projects" };
}

export function renderProject(id, from) {
  const project = getProject(id);
  if (!project) return renderNotFound();

  const context = projectContext(project, from);
  const neighbourContext = context.id === "all" ? null : context.id;
  const { prev, next } = neighbours(id, neighbourContext);
  const contextHref = context.kind === "client" ? `#/client/${esc(context.clientId)}` : `#/category/${esc(context.id)}`;
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
    spine: `${pad(context.number)} ${context.label} / ${pad(project.number, 3)}`,
    html: `
    <article class="project">
      <header class="page-head project-head">
        <p class="crumbs">
          <a href="#/">Index</a><span>/</span>
          <a href="${contextHref}">${pad(context.number)} ${esc(context.label)}</a>
        </p>
        <h1 id="page-title" tabindex="-1"><span class="no">${pad(project.number, 3)}</span>${esc(project.title)}</h1>
        ${meta ? `<dl class="meta">${meta}</dl>` : ""}
      </header>

      <div class="gallery">${gallery}</div>

      <nav class="pager" aria-label="More in ${esc(context.label)}">
        <a href="#/project/${esc(prev.id)}" data-from="${context.id}">
          <span class="micro">← Prev / ${pad(prev.number, 3)}</span><span>${esc(prev.title)}</span>
        </a>
        <a href="${contextHref}" class="pager-up" data-from="${context.id}">
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
  if (isCijd) {
    return {
      spine: "About",
      html: `
      <section class="plain">
        <header class="page-head">
          <p class="crumbs"><a href="#/">Index</a><span>/</span><span>About</span></p>
          <h1 id="page-title" tabindex="-1">CIJD</h1>
          <p class="head-note">Graphic design support in Cambodia.</p>
        </header>
        <div class="plain-body cijd-about-copy">
          <p>CIJD supports businesses in Cambodia through graphic design, print production, marketing materials and digital solutions.</p>
          <p>Design direction is led by an experienced Japanese designer, with local partners supporting production and implementation when required.</p>
          <p>Layouts and language are adapted to local use, including Khmer and multilingual communication when needed.</p>
        </div>
        <dl class="facts cijd-services">
          <div>
            <dt>DESIGN / PRINT</dt>
            <dd>
              <p>Graphic design and production support for restaurants, retail and businesses.</p>
              <p class="cijd-service-list">Menus · Packaging · Signage · Flyers · Posters · Stickers · Store graphics · Promotional materials · Multilingual design</p>
            </dd>
          </div>
          <div>
            <dt>MARKETING</dt>
            <dd>
              <p>Visual and promotional support for local campaigns, retail activity and market-facing communication.</p>
              <p class="cijd-service-list">Social media materials · In-store promotion · Sampling · Campaign tools · Test marketing · Event promotion</p>
            </dd>
          </div>
          <div>
            <dt>WEB / DIGITAL</dt>
            <dd>
              <p>Websites and digital tools are developed with local technical support, from corporate sites to operational systems and mobile services.</p>
              <p class="cijd-service-list">Websites · Multilingual websites · E-commerce · Internal tools · POS systems · Mobile applications</p>
            </dd>
          </div>
        </dl>
        <p class="cijd-about-closing">For design, production and digital support in Cambodia, <a class="text-link" href="#/contact">contact CIJD →</a></p>
      </section>`,
    };
  }
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  return {
    spine: "About",
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
        <div><dt>Contact</dt><dd><a class="text-link" href="#/contact">Telegram / @${TELEGRAM}</a></dd></div>
      </dl>
    </section>`,
  };
}

/* -------------------------------------------------------------- contact */

export function renderContact() {
  if (isCijd) {
    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=CIJD%20Co.%2C%20Ltd%2C%201A%20Street%2057%2C%20Sangkat%20Bong%20Keng%20Kang%201%2C%20Khan%20Chamkarmon%2C%20Phnom%20Penh%2C%20Cambodia";
    return {
      spine: "Contact",
      html: `
      <section class="plain">
        <header class="page-head">
          <p class="crumbs"><a href="#/">Index</a><span>/</span><span>Contact</span></p>
          <h1 id="page-title" tabindex="-1">Contact</h1>
          <p class="head-note">Design and production inquiries in Cambodia.</p>
        </header>
        <dl class="facts cijd-contact">
          <div>
            <dt>EMAIL</dt>
            <dd class="contact-list">
              <span class="contact-label micro">GENERAL</span>
              <a class="text-link" href="mailto:info@camboinfo.com">info@camboinfo.com</a>
            </dd>
          </div>
          <div>
            <dt>PHONE</dt>
            <dd class="contact-list">
              <span class="contact-label micro">CAMBODIA</span>
              <a class="text-link" href="tel:+855968886688">096 888 6688</a>
              <span class="contact-label micro contact-sub-label">JAPAN</span>
              <a class="text-link" href="tel:+815036921192">050 3692 1192</a>
            </dd>
          </div>
          <div>
            <dt>ADDRESS</dt>
            <dd>
              <a class="text-link contact-address" href="${mapsUrl}" target="_blank" rel="noopener">
                CIJD Co., Ltd<br />
                1A Street 57,<br />
                Sangkat Bong Keng Kang 1,<br />
                Khan Chamkarmon,<br />
                Phnom Penh, Cambodia ↗
              </a>
            </dd>
          </div>
        </dl>
        <p class="contact-inquiry"><a class="text-link" href="${brand.contactUrl}" target="_blank" rel="noopener">General Inquiry ↗</a></p>
      </section>`,
    };
  }
  return {
    spine: "Contact",
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
  if (isCijd) return;
  const el = root.querySelector("[data-qr]");
  if (el) renderQR(el, `https://t.me/${TELEGRAM}`);
}

/* ------------------------------------------------------------------ 404 */

export function renderNotFound() {
  return {
    spine: "404",
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
