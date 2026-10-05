// Full-screen artwork viewer.
// Desktop: click to zoom at the pointer, drag to pan, wheel / trackpad to zoom,
// ← → to move, + − 0 to zoom, Esc to close.
// Touch: pinch to zoom, drag to pan, double-tap to zoom, swipe to move.
// The artwork is never cropped at rest: it is fitted whole inside the stage.

import { viewerSources } from "./data.js";
import { pad } from "./pages.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let el; // root element
let stage, image, titleEl, countEl;
let state = null; // { project, index, opener }
let view = { s: 1, tx: 0, ty: 0 }; // zoom relative to the fitted size + translation
let fit = { left: 0, top: 0, w: 0, h: 0, scale: 1 };
let pushedHistory = false;
let hiRes = new Set(); // asset srcs whose original is in use

const pointers = new Map();
let gesture = null;
let lastTap = { t: 0, x: 0, y: 0 };

function build() {
  el = document.createElement("div");
  el.className = "viewer";
  el.hidden = true;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Artwork viewer");
  el.innerHTML = `
    <div class="viewer-bar">
      <p class="viewer-title" data-v-title></p>
      <div class="viewer-tools">
        <button type="button" data-v-out aria-label="Zoom out">−</button>
        <button type="button" data-v-in aria-label="Zoom in">+</button>
        <button type="button" data-v-close aria-label="Close viewer">Close <span aria-hidden="true">×</span></button>
      </div>
    </div>
    <div class="viewer-stage" data-v-stage>
      <img data-v-img alt="" draggable="false" />
    </div>
    <div class="viewer-foot">
      <button type="button" class="viewer-step" data-v-prev aria-label="Previous file">←</button>
      <p class="viewer-index" data-v-count aria-live="polite"></p>
      <button type="button" class="viewer-step" data-v-next aria-label="Next file">→</button>
    </div>`;
  document.body.appendChild(el);

  stage = el.querySelector("[data-v-stage]");
  image = el.querySelector("[data-v-img]");
  titleEl = el.querySelector("[data-v-title]");
  countEl = el.querySelector("[data-v-count]");

  el.querySelector("[data-v-close]").addEventListener("click", close);
  el.querySelector("[data-v-prev]").addEventListener("click", () => step(-1));
  el.querySelector("[data-v-next]").addEventListener("click", () => step(1));
  el.querySelector("[data-v-in]").addEventListener("click", () => zoomBy(1.6));
  el.querySelector("[data-v-out]").addEventListener("click", () => zoomBy(1 / 1.6));

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("wheel", onWheel, { passive: false });
  image.addEventListener("load", () => {
    image.classList.add("is-ready");
  });

  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => state && layout(true));
  window.addEventListener("popstate", () => {
    if (state) {
      pushedHistory = false;
      close();
    }
  });
}

/* ------------------------------------------------------------ open/close */

export function openViewer(project, index, opener) {
  if (!el) build();
  state = { project, index, opener };
  el.hidden = false;
  document.documentElement.classList.add("viewer-open");
  if (!pushedHistory) {
    try {
      history.pushState({ hrkViewer: true }, "");
      pushedHistory = true;
    } catch {
      /* history unavailable (sandboxed frame): Esc / Close still work */
    }
  }
  show(index);
  el.querySelector("[data-v-close]").focus({ preventScroll: true });
}

export function closeViewerSilently() {
  if (!state) return;
  pushedHistory = false;
  close();
}

function close() {
  if (!state) return;
  if (pushedHistory) {
    // Let the history entry go; popstate brings us back here to finish.
    pushedHistory = false;
    history.back();
    return;
  }
  const opener = state.opener;
  state = null;
  el.hidden = true;
  image.removeAttribute("src");
  document.documentElement.classList.remove("viewer-open");
  opener?.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ show */

function show(index) {
  const { project } = state;
  const total = project.assets.length;
  state.index = (index + total) % total;
  const asset = project.assets[state.index];

  titleEl.textContent = `${pad(project.number, 3)} ${project.title}`;
  countEl.textContent = `${pad(state.index + 1)} / ${pad(total)}`;
  el.querySelector("[data-v-prev]").disabled = total < 2;
  el.querySelector("[data-v-next]").disabled = total < 2;

  const { display, original } = viewerSources(asset);
  image.classList.remove("is-ready");
  image.alt = `${project.title} — ${asset.type || "artwork"} ${state.index + 1} of ${total}`;
  image.src = hiRes.has(asset.src) ? original : display;
  layout(true);
  preload(state.index + 1);
  preload(state.index - 1);
}

function preload(index) {
  const assets = state.project.assets;
  const asset = assets[(index + assets.length) % assets.length];
  if (asset) new Image().src = viewerSources(asset).display;
}

function step(delta) {
  if (!state || state.project.assets.length < 2) return;
  show(state.index + delta);
}

/* ---------------------------------------------------------------- layout */

function layout(reset) {
  const asset = state.project.assets[state.index];
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const w = asset.width || 1600;
  const h = asset.height || 1200;
  const scale = Math.min((sw * 0.94) / w, (sh * 0.94) / h, 1);
  fit = { w: w * scale, h: h * scale, scale, left: (sw - w * scale) / 2, top: (sh - h * scale) / 2 };
  Object.assign(image.style, {
    left: `${fit.left}px`,
    top: `${fit.top}px`,
    width: `${fit.w}px`,
    height: `${fit.h}px`,
  });
  if (reset) view = { s: 1, tx: 0, ty: 0 };
  apply();
}

function maxScale() {
  // Up to twice the artwork's own pixel size, and never less than 3× the fit.
  return Math.max(3, 2 / fit.scale);
}

function clamp() {
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const W = fit.w * view.s;
  const H = fit.h * view.s;
  view.tx = W <= sw ? (sw - W) / 2 - fit.left : Math.min(-fit.left, Math.max(sw - W - fit.left, view.tx));
  view.ty = H <= sh ? (sh - H) / 2 - fit.top : Math.min(-fit.top, Math.max(sh - H - fit.top, view.ty));
}

function apply(animate = false) {
  clamp();
  image.classList.toggle("is-animating", animate && !reduced);
  image.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`;
  el.classList.toggle("is-zoomed", view.s > 1.01);
  maybeHiRes();
}

// Swap to the untouched original once the zoom asks for more pixels than the web copy has.
function maybeHiRes() {
  const asset = state.project.assets[state.index];
  if (hiRes.has(asset.src) || !asset.web?.length) return;
  const displayWidth = asset.web[asset.web.length - 1];
  if (fit.w * view.s * (window.devicePixelRatio || 1) <= displayWidth * 1.05) return;
  const { original } = viewerSources(asset);
  const probe = new Image();
  probe.onload = () => {
    hiRes.add(asset.src);
    if (state && state.project.assets[state.index] === asset) image.src = original;
  };
  probe.src = original;
}

function zoomAt(px, py, next, animate = false) {
  const s = Math.min(maxScale(), Math.max(1, next));
  const ix = (px - fit.left - view.tx) / view.s;
  const iy = (py - fit.top - view.ty) / view.s;
  view.tx = px - fit.left - ix * s;
  view.ty = py - fit.top - iy * s;
  view.s = s;
  apply(animate);
}

function zoomBy(factor) {
  zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, view.s * factor, true);
}

function toggleZoom(px, py) {
  if (view.s > 1.01) {
    view = { s: 1, tx: 0, ty: 0 };
    apply(true);
  } else {
    // Zoom to the artwork's own pixel size, or 2.5× when it is already near that.
    zoomAt(px, py, Math.max(2.5, 1 / fit.scale), true);
  }
}

/* -------------------------------------------------------------- pointers */

function local(e) {
  const r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function onDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  try {
    stage.setPointerCapture(e.pointerId);
  } catch {
    /* synthetic or already released pointer */
  }
  pointers.set(e.pointerId, local(e));
  if (pointers.size === 1) {
    const p = local(e);
    gesture = { kind: "pan", x: p.x, y: p.y, tx: view.tx, ty: view.ty, moved: false, type: e.pointerType };
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = {
      kind: "pinch",
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      s: view.s,
      tx: view.tx,
      ty: view.ty,
      moved: true,
    };
  }
}

function onMove(e) {
  if (!pointers.has(e.pointerId) || !gesture) return;
  pointers.set(e.pointerId, local(e));

  if (gesture.kind === "pinch" && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const s = Math.min(maxScale(), Math.max(0.85, (gesture.s * dist) / gesture.dist));
    const ix = (gesture.mid.x - fit.left - gesture.tx) / gesture.s;
    const iy = (gesture.mid.y - fit.top - gesture.ty) / gesture.s;
    view.s = s;
    view.tx = mid.x - fit.left - ix * s;
    view.ty = mid.y - fit.top - iy * s;
    image.classList.remove("is-animating");
    image.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`;
    return;
  }

  if (gesture.kind === "pan") {
    const p = local(e);
    const dx = p.x - gesture.x;
    const dy = p.y - gesture.y;
    if (Math.hypot(dx, dy) > 6) gesture.moved = true;
    if (view.s > 1.01) {
      view.tx = gesture.tx + dx;
      view.ty = gesture.ty + dy;
      apply();
    } else if (gesture.moved && gesture.type !== "mouse") {
      // Swipe feedback at rest: a small horizontal follow.
      image.style.transform = `translate(${view.tx + dx * 0.25}px, ${view.ty}px) scale(1)`;
    }
  }
}

function onUp(e) {
  if (!pointers.has(e.pointerId)) return;
  const p = local(e);
  pointers.delete(e.pointerId);
  if (!gesture) return;

  if (gesture.kind === "pinch") {
    if (pointers.size === 1) {
      // Continue as a pan with the remaining finger, without a jump.
      const [rest] = [...pointers.values()];
      gesture = { kind: "pan", x: rest.x, y: rest.y, tx: view.tx, ty: view.ty, moved: true, type: "touch" };
    } else {
      gesture = null;
    }
    if (view.s < 1) view = { s: 1, tx: 0, ty: 0 };
    apply(true);
    return;
  }

  const g = gesture;
  gesture = null;
  const dx = p.x - g.x;
  const dy = p.y - g.y;

  if (!g.moved) {
    if (g.type === "mouse") {
      toggleZoom(p.x, p.y);
    } else {
      const now = performance.now();
      if (now - lastTap.t < 320 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 30) {
        toggleZoom(p.x, p.y);
        lastTap = { t: 0, x: 0, y: 0 };
      } else {
        lastTap = { t: now, x: p.x, y: p.y };
      }
    }
    return;
  }

  if (view.s <= 1.01 && g.type !== "mouse") {
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      step(dx < 0 ? 1 : -1);
      return;
    }
    apply(true);
  }
}

function onWheel(e) {
  e.preventDefault();
  const p = local(e);
  const k = e.ctrlKey ? 0.012 : 0.0018;
  zoomAt(p.x, p.y, view.s * Math.exp(-e.deltaY * k));
}

/* -------------------------------------------------------------- keyboard */

function onKey(e) {
  if (!state) return;
  switch (e.key) {
    case "Escape":
      e.preventDefault();
      close();
      break;
    case "ArrowRight":
      e.preventDefault();
      step(1);
      break;
    case "ArrowLeft":
      e.preventDefault();
      step(-1);
      break;
    case "+":
    case "=":
      e.preventDefault();
      zoomBy(1.6);
      break;
    case "-":
    case "_":
      e.preventDefault();
      zoomBy(1 / 1.6);
      break;
    case "0":
      e.preventDefault();
      view = { s: 1, tx: 0, ty: 0 };
      apply(true);
      break;
    case "Tab": {
      const items = [...el.querySelectorAll("button:not([disabled])")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!el.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
      break;
    }
    default:
  }
}
