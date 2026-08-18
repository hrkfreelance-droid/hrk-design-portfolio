import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function heroIntro(root) {
  const chunks = root.querySelectorAll(".hero-title .chunk");
  const meta = root.querySelector(".hero-meta");
  if (reduced) {
    gsap.set([chunks, meta], { opacity: 1, y: 0 });
    return;
  }
  gsap.set(chunks, { opacity: 0, y: 40 });
  gsap.set(meta, { opacity: 0, y: 12 });
  gsap.to(chunks, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.05,
    delay: 0.1,
  });
  gsap.to(meta, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.5 });
}

export function heroScrollDecompose(root) {
  if (reduced) return;
  const chunks = root.querySelectorAll(".hero-title .chunk");
  const wrapper = root.querySelector(".hero-title");

  chunks.forEach((chunk, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    gsap.to(chunk, {
      x: dir * (30 + i * 6),
      y: -40 - i * 4,
      scale: 0.92,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  if (wrapper) {
    gsap.to(wrapper, {
      opacity: 0.15,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
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

export function killScrollTriggers() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}
