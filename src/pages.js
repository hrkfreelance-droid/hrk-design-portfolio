import { projects, getProject, nextProject } from "./data.js";
import { renderQR } from "./qr.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function number(index) {
  return String(index + 1).padStart(3, "0");
}

function projectLabel(project) {
  return project.client !== "unknown" ? project.client : project.title;
}

function projectType(project) {
  return project.types.length ? project.types.join(" / ") : "Design";
}

export function renderArchive() {
  const cards = projects
    .map(
      (project, index) => `
        <article class="project-card reveal" data-project-id="${esc(project.id)}" style="--i:${index % 4}">
          <figure>
            <div class="project-thumb">
              <img
                src="${import.meta.env.BASE_URL}${project.images[0].src}"
                alt="${esc(projectLabel(project))}"
                loading="lazy"
              />
            </div>
            <figcaption class="project-caption">
              <div class="project-caption-primary">
                <span class="project-index">${number(index)}</span>
                <span class="project-name">${esc(projectLabel(project))}</span>
              </div>
              <div class="project-caption-secondary">
                <span>${esc(projectType(project))}</span>
                <span>${project.images.length} FILE${project.images.length === 1 ? "" : "S"}</span>
              </div>
            </figcaption>
          </figure>
        </article>
      `
    )
    .join("");

  return `
    <section class="archive-page">
      <div class="archive-intro">
        <div>
          <p class="micro-label">PORTFOLIO / 2026</p>
          <h1>Hiroki Toyoshima</h1>
        </div>
        <div class="archive-intro-meta">
          <p>Graphic Designer / Phnom Penh</p>
          <p>Brand / Print / Menu / Signage / Digital</p>
        </div>
      </div>

      <div class="section-index">
        <span>SELECTED WORK</span>
        <span>${projects.length} PROJECTS</span>
      </div>

      <div class="project-grid">
        ${cards}
      </div>
    </section>
  `;
}

export function renderProject(id) {
  const project = getProject(id);
  if (!project) {
    return `
      <section class="simple-page">
        <p class="micro-label">404 / PROJECT</p>
        <h1>Not found.</h1>
        <a class="text-link" href="#/">Back to work →</a>
      </section>
    `;
  }

  const next = nextProject(id);
  const images = project.images
    .map(
      (image, index) => `
        <figure class="detail-image">
          <img
            src="${import.meta.env.BASE_URL}${image.src}"
            alt="${esc(projectLabel(project))} — ${esc(image.type || "Design")}"
            loading="${index === 0 ? "eager" : "lazy"}"
          />
          <figcaption>
            <span>FIG ${String(index + 1).padStart(2, "0")}</span>
            <span>${esc(image.type || "Design")}</span>
          </figcaption>
        </figure>
      `
    )
    .join("");

  return `
    <article class="detail-page">
      <header class="detail-header">
        <a class="back-link" href="#/">← WORK</a>

        <div class="detail-title-row">
          <h1>${esc(projectLabel(project))}</h1>
          <span class="detail-count">${project.images.length} FILE${project.images.length === 1 ? "" : "S"}</span>
        </div>

        <dl class="detail-meta">
          <div>
            <dt>CLIENT</dt>
            <dd>${project.client === "unknown" ? "—" : esc(project.client)}</dd>
          </div>
          <div>
            <dt>TYPE</dt>
            <dd>${esc(projectType(project))}</dd>
          </div>
          <div>
            <dt>CATEGORY</dt>
            <dd>${esc(project.categories.join(" / ") || "—")}</dd>
          </div>
          <div>
            <dt>YEAR</dt>
            <dd>${esc(project.years.join(" / ") || "—")}</dd>
          </div>
        </dl>
      </header>

      <div class="detail-gallery">
        ${images}
      </div>

      <a class="next-project" href="#/project/${esc(next.id)}">
        <span class="micro-label">NEXT PROJECT</span>
        <span>${esc(projectLabel(next))}</span>
        <span>→</span>
      </a>
    </article>
  `;
}

export function renderAbout() {
  return `
    <section class="simple-page">
      <p class="micro-label">ABOUT / HRK_DESIGN</p>
      <h1>Hiroki Toyoshima</h1>
      <div class="simple-copy">
        <p>Graphic designer based in Phnom Penh, working across branding, print, menus, signage, digital design and practical production.</p>
        <p>Available for selected design projects.</p>
      </div>
    </section>
  `;
}

export function renderContact() {
  return `
    <section class="simple-page contact-page">
      <p class="micro-label">CONTACT / DIRECT</p>
      <h1>Contact</h1>
      <div class="simple-copy">
        <p><a class="text-link" href="https://t.me/hiroki_pp" target="_blank" rel="noopener">Telegram / @hiroki_pp →</a></p>
      </div>
      <div class="qr-wrap" data-qr></div>
    </section>
  `;
}

export function mountContactExtras(root) {
  const qrEl = root.querySelector("[data-qr]");
  if (qrEl) renderQR(qrEl, "https://t.me/hiroki_pp");
}
