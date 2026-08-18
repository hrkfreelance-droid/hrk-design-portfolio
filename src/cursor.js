export function initCursor() {
  if (window.matchMedia("(hover: none)").matches) return;

  const tag = document.querySelector("[data-cursor-tag]");
  if (!tag) return;

  let raf = null;
  let mx = 0, my = 0;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      tag.style.transform = `translate(${mx + 16}px, ${my + 16}px)`;
      raf = null;
    });
  });

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("[data-cursor-hover]")) {
      tag.style.opacity = "1";
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-cursor-hover]")) {
      tag.style.opacity = "0";
    }
  });
}
