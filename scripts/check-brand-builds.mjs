import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const hrkDir = process.env.PORTFOLIO_HRK_BUILD || "dist";
const cijdDir = process.env.PORTFOLIO_CIJD_BUILD || "dist-cijd";
const failures = [];

function readBuild(dir, file) {
  return readFileSync(join(root, dir, file), "utf8");
}

function filesUnder(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else out.push(relative(dir, path));
    }
  };
  walk(dir);
  return out.sort();
}

const hrkHtml = readBuild(hrkDir, "index.html");
const cijdHtml = readBuild(cijdDir, "index.html");
const sharedFiles = ["data/portfolio.json"];
for (const folder of ["assets/portfolio", "assets/web"]) {
  for (const file of filesUnder(join(root, hrkDir, folder))) sharedFiles.push(`${folder}/${file}`);
}

if (!hrkHtml.includes('data-brand="hrk"') || !hrkHtml.includes("hrk_design") || !hrkHtml.includes("t.me/hiroki_pp")) {
  failures.push("HRK build is missing its existing identity or contact destination");
}
if (/__BRAND_[A-Z_]+__/.test(hrkHtml) || /__BRAND_[A-Z_]+__/.test(cijdHtml)) failures.push("unresolved brand placeholder in HTML");
if (!cijdHtml.includes('data-brand="cijd"') || !cijdHtml.includes("CIJD") || !cijdHtml.includes("camboinfo.com/contacts/")) {
  failures.push("CIJD build is missing its identity or inquiry destination");
}
if (!cijdHtml.includes("cijd-design-portfolio-preview") || /hrk_design|hiroki_pp|t\.me\/hiroki_pp/i.test(cijdHtml)) {
  failures.push("CIJD build metadata or links contain the wrong brand");
}

for (const file of sharedFiles) {
  const hrkPath = join(root, hrkDir, file);
  const cijdPath = join(root, cijdDir, file);
  try {
    const hrkHash = createHash("sha256").update(readFileSync(hrkPath)).digest("hex");
    const cijdHash = createHash("sha256").update(readFileSync(cijdPath)).digest("hex");
    if (hrkHash !== cijdHash) failures.push(`shared asset differs between builds: ${file}`);
  } catch {
    failures.push(`missing shared asset in one build: ${file}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Brand builds OK — shared portfolio.json and ${sharedFiles.length - 1} original/WebP assets are byte-identical`);
