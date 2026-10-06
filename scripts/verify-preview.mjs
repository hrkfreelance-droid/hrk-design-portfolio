// Live check of a deployed preview. Used by .github/workflows/cloudflare-preview.yml.
// Usage: PREVIEW_URL=https://… node scripts/verify-preview.mjs
// Needs `playwright` + Chromium (installed in the workflow, not a project dependency).
import { readFileSync, appendFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.env.PREVIEW_URL || "").replace(/\/?$/, "/");
const EXPECTED_BRAND = process.env.EXPECTED_BRAND === "cijd" ? "cijd" : "hrk";
if (!/^https?:\/\//.test(BASE)) throw new Error("PREVIEW_URL missing");

const data = JSON.parse(readFileSync(new URL("../public/data/portfolio.json", import.meta.url)));
const pub = data.projects.filter((p) => p.visible && p.status === "published");
const artworkCount = pub.reduce((count, project) => count + project.assets.length, 0);
const cats = data.categories.filter((c) => pub.some((p) => p.categories.includes(c.id)));
const clientGroups = new Map();
for (const project of pub) {
  if (typeof project.client !== "string" || !project.client.trim()) continue;
  const name = project.client.trim().replace(/\s+/g, " ");
  const key = name.normalize("NFKC").toLocaleLowerCase("en");
  if (!clientGroups.has(key)) clientGroups.set(key, { name, projects: [] });
  clientGroups.get(key).projects.push(project);
}
const clientSlug = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clients = [...clientGroups.values()].map((client) => ({ ...client, id: clientSlug(client.name) || client.projects[0].id })).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
const routes = ["#/", "#/clients", "#/moodboard", ...clients.map((client) => `#/client/${client.id}`), "#/about", "#/contact", "#/category/all", ...cats.map((c) => `#/category/${c.id}`), ...pub.map((p) => `#/project/${p.id}`)];

const problems = [];
const routeView = (route) => route.replace(/^#\/?/, "").split("/")[0] || "index";
const notes = [];
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript((t, key) => localStorage.setItem(key, t), theme, `${EXPECTED_BRAND}-theme`);
    const page = await ctx.newPage();
    const tag = `${theme} ${width}`;
    page.on("pageerror", (e) => problems.push(`${tag} pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && problems.push(`${tag} console: ${m.text()}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`${tag} HTTP ${r.status()} ${r.url()}`));

    for (const route of routes) {
      await page.goto(BASE + route);
      await page.waitForFunction((view) => document.querySelector("[data-app]")?.dataset.view === view, routeView(route));
      await page.waitForTimeout(300);
      await page.waitForSelector("#page-title", { timeout: 15000 });
      const identity = await page.evaluate(() => ({
        brand: document.documentElement.dataset.brand,
        label: document.querySelector(".logo")?.textContent,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || "",
        canonical: document.querySelector('link[rel="canonical"]')?.href || "",
        accent: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
      }));
      const expectedLabel = EXPECTED_BRAND === "cijd" ? "CIJD" : "hrk_design";
      if (identity.brand !== EXPECTED_BRAND || identity.label !== expectedLabel) problems.push(`${tag} incorrect brand identity: ${JSON.stringify(identity)}`);
      if (EXPECTED_BRAND === "cijd" && (/hrk_design|hiroki_pp/i.test(identity.description) || !identity.canonical.includes("cijd-design-portfolio-preview"))) {
        problems.push(`${tag} incorrect CIJD metadata: ${JSON.stringify(identity)}`);
      }
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
      const expectedAccent = EXPECTED_BRAND === "cijd" ? theme === "dark" ? "#0084d0" : "#006faf" : theme === "dark" ? "#f0533c" : "#e23b24";
      if (identity.accent !== expectedAccent) problems.push(`${tag} wrong ${EXPECTED_BRAND} accent ${identity.accent}`);
      if (EXPECTED_BRAND === "cijd" && /hrk_design|@hiroki_pp|t\.me\/hiroki_pp/i.test(await page.locator("body").innerText())) problems.push(`${tag} ${route} includes HRK content`);
      if (route === "#/contact") {
        if (EXPECTED_BRAND === "cijd") {
          const contact = await page.evaluate(() => ({
            hrefs: [...document.querySelectorAll(".cijd-contact a, .contact-inquiry a")].map((a) => a.getAttribute("href")),
            columns: getComputedStyle(document.querySelector(".cijd-contact")).gridTemplateColumns.split(" ").length,
            addressTarget: document.querySelector(".contact-address")?.target,
            inquiryTarget: document.querySelector(".contact-inquiry a")?.target,
          }));
          for (const href of [
            "mailto:info@camboinfo.com",
            "tel:+855968886688",
            "tel:+815036921192",
            "https://www.google.com/maps/search/?api=1&query=CIJD%20Co.%2C%20Ltd%2C%201A%20Street%2057%2C%20Sangkat%20Bong%20Keng%20Kang%201%2C%20Khan%20Chamkarmon%2C%20Phnom%20Penh%2C%20Cambodia",
            "https://camboinfo.com/contacts/",
          ]) if (!contact.hrefs.includes(href)) problems.push(`${tag} CIJD contact missing ${href}`);
          const expectedColumns = width < 760 ? 1 : 3;
          if (contact.columns !== expectedColumns) problems.push(`${tag} CIJD contact uses ${contact.columns} columns, expected ${expectedColumns}`);
          if (contact.addressTarget !== "_blank" || contact.inquiryTarget !== "_blank") problems.push(`${tag} CIJD external contact links should open in a new tab`);
          if (contact.hrefs.some((href) => href?.startsWith("https://t.me/"))) problems.push(`${tag} CIJD contact contains an unverified Telegram link`);
        } else if (/CIJD Co\., Ltd|info@camboinfo\.com|096 888 6688|050 3692 1192/.test(await page.locator("body").innerText())) {
          problems.push(`${tag} HRK contact contains CIJD details`);
        }
      }
      if (route === "#/clients") {
        const browse = await page.evaluate(() => ({
          active: document.querySelector('.index-switch a[aria-current="page"]')?.textContent.trim(),
          rows: [...document.querySelectorAll(".index-list > li")].map((li) => ({
            href: li.querySelector("a")?.getAttribute("href"),
            name: li.querySelector(".label")?.childNodes[0]?.textContent.trim(),
            count: Number(li.querySelector(".count")?.textContent.trim()),
          })),
        }));
        if (browse.active?.toLowerCase() !== "client") problems.push(`${tag} CLIENT switch is not active`);
        if (browse.rows.length !== clients.length) problems.push(`${tag} client list count ${browse.rows.length}, expected ${clients.length}`);
        clients.forEach((client, index) => {
          const row = browse.rows[index];
          if (row?.href !== `#/client/${client.id}` || row.name !== client.name.toLocaleUpperCase("en") || row.count !== client.projects.length) {
            problems.push(`${tag} incorrect client row ${index + 1}: ${JSON.stringify(row)}`);
          }
        });
      }
      if (route === "#/moodboard") {
        const board = await page.evaluate(() => ({
          title: document.querySelector("#page-title")?.textContent.trim(),
          active: document.querySelector('.moodboard-switch a[aria-current="page"]')?.textContent.trim(),
          tiles: [...document.querySelectorAll(".mood-tile")].map((tile) => ({
            href: tile.getAttribute("href"),
            project: tile.dataset.project,
            client: tile.dataset.client,
            from: tile.dataset.from,
            width: Number(tile.querySelector("img")?.getAttribute("width")),
            height: Number(tile.querySelector("img")?.getAttribute("height")),
            fit: getComputedStyle(tile.querySelector("img")).objectFit,
          })),
          clientHeaders: document.querySelectorAll(".moodboard-grid h2, .moodboard-grid h3, .moodboard-grid section").length,
          ready: document.querySelector(".moodboard-grid")?.classList.contains("is-ready"),
        }));
        if (board.title !== "ALL" || board.active !== "ALL") problems.push(`${tag} moodboard does not use ALL as its active view`);
        if (board.tiles.length !== artworkCount) problems.push(`${tag} moodboard has ${board.tiles.length} artworks, expected ${artworkCount}`);
        if (board.clientHeaders) problems.push(`${tag} moodboard has client/category sections`);
        if (!board.ready) problems.push(`${tag} moodboard layout did not initialize`);
        if (board.tiles.some((tile) => !tile.href?.startsWith(`#/project/${tile.project}`) || tile.from !== "all" || !tile.width || !tile.height || tile.fit !== "contain")) {
          problems.push(`${tag} moodboard has a missing project link or unscaled artwork`);
        }
        let repeat = 1;
        for (let i = 1; i < board.tiles.length; i++) {
          repeat = board.tiles[i].client && board.tiles[i].client === board.tiles[i - 1].client ? repeat + 1 : 1;
          if (repeat > 1) problems.push(`${tag} moodboard repeats a client in adjacent artworks`);
        }
        if (width >= 900 && theme === "light") {
          await page.waitForTimeout(2100);
          const movement = await page.evaluate(() => window.scrollY);
          if (movement < 1) problems.push(`${tag} moodboard did not start its delayed desktop scroll`);
          await page.mouse.move(300, 300);
          await page.locator(".mood-tile").first().hover();
          const hover = await page.evaluate(() => ({
            paused: document.querySelector(".moodboard-grid")?.classList.contains("has-hover"),
            transform: getComputedStyle(document.querySelector(".mood-tile:hover")).transform,
          }));
          if (!hover.paused || hover.transform === "none") problems.push(`${tag} moodboard hover did not pause and lift the tile`);
        }
      }
      if (route.startsWith("#/client/")) {
        const client = clients.find((item) => route === `#/client/${item.id}`);
        const detail = await page.evaluate(() => ({
          title: document.querySelector("#page-title")?.textContent.trim(),
          count: document.querySelector(".client-count")?.textContent.trim(),
          projects: [...document.querySelectorAll(".plist .prow")].map((row) => row.getAttribute("href")),
        }));
        if (!client || detail.title !== client.name.toLocaleUpperCase("en") || !detail.count?.startsWith(String(client.projects.length).padStart(2, "0")) || detail.projects.length !== client.projects.length) {
          problems.push(`${tag} incorrect client page ${route}: ${JSON.stringify(detail)}`);
        } else if (detail.projects.some((href, index) => href !== `#/project/${client.projects[index].id}`)) {
          problems.push(`${tag} incorrect projects on ${route}`);
        }
      }
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
