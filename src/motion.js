const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Quiet Apple-style entrance: opacity + slight rise + blur settle.
export function heroIntro(root) {
  if (!root) return;
  const title = root.querySelector(".hero-title");
  const kicker = root.querySelector(".hero-kicker");
  const meta = root.querySelector(".hero-meta");

  if (reduced) return;

  [kicker, title, meta].forEach((el) => el && el.classList.add("entrance"));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (kicker) kicker.classList.add("entrance-in");
      if (title) setTimeout(() => title.classList.add("entrance-in"), 80);
      if (meta) setTimeout(() => meta.classList.add("entrance-in"), 260);
    });
  });
}

export function revealOnScroll(selector = ".reveal") {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;

  if (reduced) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}
