import "./style.css";
import { initTheme } from "./theme.js";
import { revealOnScroll } from "./motion.js";
import { renderArchive, renderProject, renderAbout, renderContact, mountContactExtras } from "./pages.js";
import { loadData } from "./data.js";

const app = document.querySelector("[data-app]");
document.querySelector("[data-year]").textContent = new Date().getFullYear();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initTheme();

function setActiveNav(path) {
  document.querySelectorAll(".main-nav a").forEach((a) => a.removeAttribute("aria-current"));
  const navPath = path === "about" || path === "contact" ? path : "work";
  const match = document.querySelector(`.main-nav a[data-nav="${navPath}"]`);
  if (match) match.setAttribute("aria-current", "page");
}

function initProjectLinks(root) {
  root.querySelectorAll("[data-project-id]").forEach((item) => {
    const open = () => {
      window.location.hash = `#/project/${item.dataset.projectId}`;
    };

    item.addEventListener("click", open);
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "link");
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter") open();
    });
  });
}

function renderRoute() {
  const hash = window.location.hash || "#/";
  const [, path, param] = hash.match(/^#\/?(\w*)\/?(.*)$/) || [];

  setActiveNav(path);
  window.scrollTo({ top: 0, behavior: "auto" });

  if (!path || path === "work") {
    app.innerHTML = renderArchive();
    initProjectLinks(app);
    revealOnScroll();
  } else if (path === "project") {
    app.innerHTML = renderProject(param);
  } else if (path === "about") {
    app.innerHTML = renderAbout();
  } else if (path === "contact") {
    app.innerHTML = renderContact();
    mountContactExtras(app);
  } else {
    app.innerHTML = renderArchive();
    initProjectLinks(app);
    revealOnScroll();
  }
}

function route() {
  if (reduced) {
    renderRoute();
    return;
  }

  app.classList.add("page-fade-out");
  window.setTimeout(() => {
    renderRoute();
    app.classList.remove("page-fade-out");
  }, 120);
}

loadData().then(() => {
  window.addEventListener("hashchange", route);
  renderRoute();
});
