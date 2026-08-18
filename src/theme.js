const STORAGE_KEY = "hrk-theme";

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = stored || system;
  applyTheme(theme);

  const toggle = document.querySelector("[data-theme-toggle]");
  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || system;
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const label = document.querySelector("[data-theme-label]");
  if (label) label.textContent = theme === "dark" ? "DARK" : "LIGHT";
}
