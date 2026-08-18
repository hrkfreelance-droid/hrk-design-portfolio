import "./style.css";
import { initTheme } from "./theme.js";
import { initCursor } from "./cursor.js";
import { heroIntro, heroScrollDecompose, revealOnScroll, killScrollTriggers } from "./motion.js";
import { renderHome, renderWork, renderProject, renderAbout, renderContact, mountContactExtras } from "./pages.js";
import { loadData } from "./data.js";

const app = document.querySelector("[data-app]");
document.querySelector("[data-year]").textContent = new Date().getFullYear();

initTheme();
initCursor();

function setActiveNav(path) {
  document.querySelectorAll(".main-nav a").forEach((a) => a.removeAttribute("aria-current"));
  const match = document.querySelector(`.main-nav a[href="#${path.split("/").slice(0, 2).join("/")}"]`);
  if (match) match.setAttribute("aria-current", "page");
}

function initFilters(root) {
  const filterBar = root.querySelector("[data-filters]");
  const grid = root.querySelector("[data-work-grid]");
  if (!filterBar || !grid) return;

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    filterBar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    const filter = btn.dataset.filter;
    grid.querySelectorAll(".work-item").forEach((item) => {
      const show = filter === "all" || item.dataset.category === filter;
      item.style.display = show ? "" : "none";
    });
  });
}

function initWorkLinks(root) {
  root.querySelectorAll("[data-work-id]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.hash = `#/project/${item.dataset.workId}`;
    });
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "link");
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.location.hash = `#/project/${item.dataset.workId}`;
    });
  });
}

function route() {
  killScrollTriggers();
  const tag = document.querySelector("[data-cursor-tag]");
  if (tag) tag.style.opacity = "0";
  const hash = window.location.hash || "#/";
  const [, path, param] = hash.match(/^#\/?(\w*)\/?(.*)$/) || [];
  setActiveNav(`/${path}`);

  window.scrollTo({ top: 0, behavior: "auto" });

  if (!path) {
    app.innerHTML = renderHome();
    const hero = app.querySelector("[data-hero]");
    heroIntro(hero);
    heroScrollDecompose(hero);
    initFilters(app);
    initWorkLinks(app);
    revealOnScroll();
  } else if (path === "work") {
    app.innerHTML = renderWork();
    initFilters(app);
    initWorkLinks(app);
    revealOnScroll();
  } else if (path === "project") {
    app.innerHTML = renderProject(param);
  } else if (path === "about") {
    app.innerHTML = renderAbout();
  } else if (path === "contact") {
    app.innerHTML = renderContact();
    mountContactExtras(app);
  } else {
    app.innerHTML = renderHome();
  }
}

loadData().then(() => {
  window.addEventListener("hashchange", route);
  route();
});
