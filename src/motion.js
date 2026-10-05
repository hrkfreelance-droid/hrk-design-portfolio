const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let observer;

// Quiet entrance for list items: opacity + a few pixels of rise. Nothing else.
export function revealOnScroll(root = document) {
  const items = root.querySelectorAll(".reveal");
  if (!items.length) return;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -24px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}
