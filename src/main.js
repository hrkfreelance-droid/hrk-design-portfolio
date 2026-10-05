import "./style.css";
import { initTheme } from "./theme.js";
import { revealOnScroll } from "./motion.js";
import { renderWork, renderProject, renderAbout, renderContact, mountContact, renderNotFound } from "./pages.js";
import { loadData, getProject } from "./data.js";

const app = document.querySelector("[data-app]");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SITE = "hrk_design — Hiroki Toyoshima";

// Remember where the work list was scrolled so "← WORK" returns to the same place.
const scrollMemory = new Map();
let currentKey = null;
let firstRender = true;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
document.querySelector("[data-year]").textContent = new Date().getFullYear();
initTheme();

function parse() {
  const [, path = "", param = ""] = (window.location.hash || "#/").match(/^#\/?([\w-]*)\/?(.*)$/) || [];
  return { path: path || "work", param: decodeURIComponent(param) };
}

function setActiveNav(path) {
  const section = path === "about" || path === "contact" ? path : "work";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === section) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function render() {
  const { path, param } = parse();
  const key = `${path}/${param}`;
  if (currentKey) scrollMemory.set(currentKey, window.scrollY);
  currentKey = key;

  let title = SITE;
  if (path === "work") {
    app.innerHTML = renderWork();
  } else if (path === "project") {
    const project = getProject(param);
    app.innerHTML = renderProject(param);
    title = project ? `${project.title} — hrk_design` : `Not found — hrk_design`;
  } else if (path === "about") {
    app.innerHTML = renderAbout();
    title = `About — hrk_design`;
  } else if (path === "contact") {
    app.innerHTML = renderContact();
    mountContact(app);
    title = `Contact — hrk_design`;
  } else {
    app.innerHTML = renderNotFound();
    title = `Not found — hrk_design`;
  }

  document.title = title;
  setActiveNav(path);
  revealOnScroll(app);
  window.scrollTo(0, scrollMemory.get(key) || 0);

  // Move focus to the new page heading for keyboard / screen reader users.
  if (!firstRender) app.querySelector("#page-title")?.focus({ preventScroll: true });
  firstRender = false;
}

function route() {
  if (reduced) return render();
  app.classList.add("is-leaving");
  window.setTimeout(() => {
    render();
    app.classList.remove("is-leaving");
  }, 140);
}

loadData()
  .then(() => {
    window.addEventListener("hashchange", route);
    render();
  })
  .catch((error) => {
    console.error(error);
    app.innerHTML = `<section class="page"><p class="micro">ERROR</p><h1>Could not load work.</h1></section>`;
  });
