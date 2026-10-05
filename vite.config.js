import { defineConfig } from "vite";

// GitHub Pages serves the site from /hrk-design-portfolio/. `vite preview`
// must use the same base as the build, only the dev server runs at "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/hrk-design-portfolio/" : "/",
}));
