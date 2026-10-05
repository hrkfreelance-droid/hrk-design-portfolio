// Live check of a deployed preview. Used by .github/workflows/cloudflare-preview.yml.
// Usage: PREVIEW_URL=https://… node scripts/verify-preview.mjs
// Needs `playwright` + Chromium (installed in the workflow, not a project dependency).
import { readFileSync, appendFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.env.PREVIEW_URL || "").replace(/\/?$/, "/");
if (!/^https?:\/\//.test(BASE)) throw new Error("PREVIEW_URL missing");

const data = JSON.parse(readFileSync(new URL("../public/data/portfolio.json", import.meta.url)));
const pub = data.projects.filter((p) => p.visible && p.status === "published");
const cats = data.categories.filter((c) => pub.some((p) => p.categories.includes(c.id)));
const routes = ["#/", "#/about", "#/contact", "#/category/all", ...cats.map((c) => `#/category/${c.id}`), ...pub.map((p) => `#/project/${p.id}`)];

const problems = [];
const notes = [];
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript((t) => localStorage.setItem("hrk-theme", t), theme);
    const page = await ctx.newPage();
    const tag = `${theme} ${width}`;
    page.on("pageerror", (e) => problems.push(`${tag} pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && problems.push(`${tag} console: ${m.text()}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`${tag} HTTP ${r.status()} ${r.url()}`));

    for (const route of routes) {
      await page.goto(BASE + route);
      await page.waitForTimeout(300);
      await page.waitForSelector("#page-title", { timeout: 15000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const out = { broken: [], crops: [], squares: 0, overflow: false, theme: document.documentElement.dataset.theme };
        out.squares = document.querySelectorAll(".marks, .legend").length;
        out.overflow = document.documentElement.scrollWidth > window.innerWidth;
        for (const img of document.images) {
          if (img.complete && img.naturalWidth === 0) out.broken.push(img.src);
          if (!img.naturalWidth) continue;
          const b = img.getBoundingClientRect();
          if (!b.width || !b.height) continue;
          const fit = getComputedStyle(img).objectFit;
          const ratio = b.width / b.height / (img.naturalWidth / img.naturalHeight);
          if (fit === "cover" || (fit !== "contain" && Math.abs(ratio - 1) > 0.02)) out.crops.push(img.src);
          for (let a = img.parentElement; a && a !== document.body; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (cs.overflow === "visible" && cs.overflowX === "visible") continue;
            const ab = a.getBoundingClientRect();
            if (b.left < ab.left - 1 || b.right > ab.right + 1 || b.top < ab.top - 1 || b.bottom > ab.bottom + 1) out.crops.push(img.src);
          }
        }
        return out;
      });
      if (r.theme !== theme) problems.push(`${tag} ${route} theme is ${r.theme}`);
      if (r.squares) problems.push(`${tag} ${route} square counters present`);
      if (r.overflow) problems.push(`${tag} ${route} horizontal overflow`);
      r.broken.forEach((s) => problems.push(`${tag} ${route} broken ${s}`));
      r.crops.forEach((s) => problems.push(`${tag} ${route} crop ${s}`));
    }

    // Viewer: every file of every project opens whole; keys work on desktop.
    let fitted = 0;
    for (const project of pub) {
      await page.goto(BASE + `#/project/${project.id}`);
      await page.waitForTimeout(250);
      await page.click('[data-open="0"]');
      for (let i = 0; i < project.assets.length; i++) {
        await page.waitForFunction(() => document.querySelector(".viewer img")?.classList.contains("is-ready"), null, { timeout: 15000 });
        const whole = await page.evaluate(() => {
          const a = document.querySelector("[data-v-img]").getBoundingClientRect();
          const s = document.querySelector("[data-v-stage]").getBoundingClientRect();
          return a.left >= s.left - 1 && a.right <= s.right + 1 && a.top >= s.top - 1 && a.bottom <= s.bottom + 1;
        });
        if (!whole) problems.push(`${tag} viewer ${project.id} #${i + 1} not whole at rest`);
        fitted++;
        if (i < project.assets.length - 1) await page.keyboard.press("ArrowRight");
      }
      if (project.assets.length > 1) {
        const count = await page.textContent("[data-v-count]");
        if (!count.startsWith(String(project.assets.length).padStart(2, "0"))) problems.push(`${tag} viewer ${project.id} counter ${count}`);
      }
      await page.keyboard.press("+");
      await page.waitForTimeout(300);
      if (!(await page.evaluate(() => document.querySelector(".viewer").classList.contains("is-zoomed")))) problems.push(`${tag} viewer ${project.id} + did not zoom`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
      if (!(await page.evaluate(() => document.querySelector(".viewer").hidden))) problems.push(`${tag} viewer ${project.id} Esc did not close`);
    }
    notes.push(`${tag}: ${routes.length} routes, ${fitted} viewer files`);
    await ctx.close();
  }
}
await browser.close();

const lines = [`### Live preview check`, ``, `URL: ${BASE}`, ``, ...notes.map((n) => `- ${n}`), ``, problems.length ? `**${problems.length} problems**` : "**All checks passed** (squares 0, crops 0, broken images 0, console errors 0, overflow 0)", ...problems.slice(0, 50).map((p) => `- ${p}`)];
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
process.exit(problems.length ? 1 : 0);
