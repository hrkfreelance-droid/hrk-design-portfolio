import "./style.css";
import { initTheme } from "./theme.js";
import { initCursor } from "./cursor.js";
import { heroIntro, revealOnScroll } from "./motion.js";
import { renderHero, renderCategory, renderProject, renderAbout, renderContact, mountContactExtras } from "./pages.js";
import { loadData, categories } from "./data.js";

const app = document.querySelector("[data-app]");
document.querySelector("[data-year]").textContent = new Date().getFullYear();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initTheme();
initCursor();

function setActiveNav(path) {
  document.querySelectorAll(".main-nav a").forEach((a) => a.removeAttribute("aria-current"));
  const workPaths = ["work", ...categories];
  let navPath = `/${path}`;
  if (workPaths.includes(path)) navPath = "/work";
  const match = document.querySelector(`.main-nav a[href="#${navPath}"]`);
  if (match) match.setAttribute("aria-current", "page");
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

function renderRoute() {
  const tag = document.querySelector("[data-cursor-tag]");
  if (tag) tag.style.opacity = "0";
  const hash = window.location.hash || "#/";
  const [, path, param] = hash.match(/^#\/?(\w*)\/?(.*)$/) || [];
  setActiveNav(path);

  window.scrollTo({ top: 0, behavior: "auto" });

  const categoryPaths = ["work", ...categories];

  if (!path) {
    app.innerHTML = renderHero();
    heroIntro(app.querySelector("[data-hero]"));
  } else if (categoryPaths.includes(path)) {
    app.innerHTML = renderCategory(path);
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
    app.innerHTML = renderHero();
    heroIntro(app.querySelector("[data-hero]"));
  }
}

function route() {
  if (reduced) {
    renderRoute();
    return;
  }
  app.classList.add("page-fade-out");
  setTimeout(() => {
    renderRoute();
    app.classList.remove("page-fade-out");
    app.classList.add("page-fade-in");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => app.classList.remove("page-fade-in"));
    });
  }, 160);
}

loadData().then(() => {
  window.addEventListener("hashchange", route);
  renderRoute();
});
