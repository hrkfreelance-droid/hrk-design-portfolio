import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./style.css";
import { initTheme } from "./theme.js";
import { loadData, getProject, getCategory, getClient } from "./data.js";
import {
  renderIndex,
  renderCategory,
  renderClient,
  renderMoodboard,
  mountCategory,
  mountMoodboard,
  renderProject,
  projectContext,
  renderAbout,
  renderContact,
  mountContact,
  renderNotFound,
} from "./pages.js";
import { openViewer, closeViewerSilently } from "./viewer.js";
import { brand } from "./brand.js";

const app = document.querySelector("[data-app]");
const spine = document.querySelector("[data-spine]");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Where the visitor came from (category id), so a project keeps its list context.
const CONTEXT_KEY = "hrk-context";
let context = null;
try {
  context = sessionStorage.getItem(CONTEXT_KEY);
} catch {
  /* storage unavailable */
}

const scrollMemory = new Map();
let currentKey = null;
let firstRender = true;
let cleanupPage = null;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
document.querySelector("[data-year]").textContent = new Date().getFullYear();
document.documentElement.dataset.brand = brand.id;
initTheme();

function setContext(id) {
  context = id;
  try {
    sessionStorage.setItem(CONTEXT_KEY, id);
  } catch {
    /* ignore */
  }
}

function parse() {
  const [, path = "", param = ""] = (window.location.hash || "#/").match(/^#\/?([\w-]*)\/?(.*)$/) || [];
  return { path: path || "index", param: decodeURIComponent(param) };
}

function setActiveNav(path) {
  const section = path === "about" || path === "contact" ? path : "index";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === section) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function render() {
  closeViewerSilently();
  cleanupPage?.();
  cleanupPage = null;
  const { path, param } = parse();
  const key = `${path}/${param}`;
  if (currentKey) scrollMemory.set(currentKey, window.scrollY);
  currentKey = key;

  let page;
  let title = brand.pageTitle;
  if (path === "index") {
    page = renderIndex();
    title = `${brand.pageTitle} — Index`;
  } else if (path === "clients") {
    page = renderIndex("client");
    title = `Clients — ${brand.pageTitle}`;
  } else if (path === "category") {
    setContext(param);
    page = renderCategory(param);
    const label = param === "all" ? "All projects" : getCategory(param)?.label || "Not found";
    title = `${label} — ${brand.pageTitle}`;
  } else if (path === "client") {
    setContext(`client:${param}`);
    const client = getClient(param);
    page = renderClient(param);
    title = client ? `${client.name} — ${brand.pageTitle}` : `Not found — ${brand.pageTitle}`;
  } else if (path === "moodboard") {
    page = renderMoodboard();
    title = `ALL — ${brand.pageTitle}`;
  } else if (path === "project") {
    const project = getProject(param);
    page = renderProject(param, context);
    title = project ? `${project.title} — ${brand.pageTitle}` : `Not found — ${brand.pageTitle}`;
    if (project) setContext(projectContext(project, context).id);
  } else if (path === "about") {
    page = renderAbout();
    title = `About — ${brand.pageTitle}`;
  } else if (path === "contact") {
    page = renderContact();
    title = `Contact — ${brand.pageTitle}`;
  } else {
    page = renderNotFound();
    title = `Not found — ${brand.pageTitle}`;
  }

  app.innerHTML = page.html;
  app.dataset.view = path;
  spine.textContent = page.spine;
  document.title = title;
  setActiveNav(path);

  if (path === "category" || path === "client") mountCategory(app);
  if (path === "moodboard") cleanupPage = mountMoodboard(app);
  if (path === "contact") mountContact(app);
  if (path === "project") mountProject(param);

  window.scrollTo(0, scrollMemory.get(key) || 0);
  if (!firstRender) app.querySelector("#page-title")?.focus({ preventScroll: true });
  firstRender = false;
}

function mountProject(id) {
  const project = getProject(id);
  if (!project) return;
  app.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openViewer(project, Number(button.dataset.open), button));
  });
}

// The skip link must not go through the hash router.
document.querySelector(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  app.focus();
});

// Links that carry a list context (category → project, pager).
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-from]");
  if (link) setContext(link.dataset.from);
});

function route() {
  if (reduced) return render();
  app.classList.add("is-leaving");
  window.setTimeout(() => {
    render();
    app.classList.remove("is-leaving");
  }, 120);
}

loadData()
  .then(() => {
    window.addEventListener("hashchange", route);
    render();
  })
  .catch((error) => {
    console.error(error);
    app.innerHTML = `<section class="plain"><header class="page-head"><h1>Could not load the index.</h1></header></section>`;
  });
