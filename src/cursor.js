export function initCursor() {
  if (window.matchMedia("(hover: none)").matches) return;

  const tag = document.querySelector("[data-cursor-tag]");
  if (!tag) return;

  let mx = 0, my = 0;
  let tx = 0, ty = 0;
  let started = false;

  const lerp = 0.16;

  function loop() {
    tx += (mx - tx) * lerp;
    ty += (my - ty) * lerp;
    tag.style.transform = `translate(${tx + 16}px, ${ty + 16}px)`;
    requestAnimationFrame(loop);
  }

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!started) {
      started = true;
      tx = mx;
      ty = my;
      requestAnimationFrame(loop);
    }
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
