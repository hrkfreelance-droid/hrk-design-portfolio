const STORAGE_KEY = `${import.meta.env.VITE_BRAND || "hrk"}-theme`;

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable — theme still switches for this visit */
  }
}

// Light is the default; dark only when the visitor has chosen it.
export function initTheme() {
  applyTheme(read() === "dark" ? "dark" : "light");

  const toggle = document.querySelector("[data-theme-toggle]");
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    write(next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  const other = theme === "dark" ? "light" : "dark";
  toggle.textContent = other;
  toggle.setAttribute("aria-label", `Switch to ${other} theme`);
}
