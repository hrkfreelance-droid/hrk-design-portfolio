const STORAGE_KEY = "hrk-theme";

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  applyTheme(stored === "dark" ? "dark" : "light");

  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const label = document.querySelector("[data-theme-label]");
  if (label) label.textContent = theme;
}
