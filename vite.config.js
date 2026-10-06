import { defineConfig } from "vite";

// GitHub Pages serves HRK from /hrk-design-portfolio/; both Pages previews use /.
export default defineConfig(({ command, isPreview }) => {
  const cijd = process.env.VITE_BRAND === "cijd";
  const brand = cijd
    ? {
        label: "CIJD",
        title: "CIJD — Index",
        description: "CIJD provides graphic design support for businesses in Cambodia, including menus, packaging, signage and promotional materials.",
        ogDescription: "Graphic design support for businesses in Cambodia.",
        themeColor: "#ffffff",
        canonical: "https://portfolio-2026-refresh.cijd-design-portfolio-preview.pages.dev/",
        favicon: "/favicon-cijd.svg",
        footerHref: "https://camboinfo.com/contacts/",
        footerLabel: "Inquiry / CamboInfo",
      }
    : {
        label: "hrk_design",
        title: "hrk_design — Index",
        description: "hrk_design — an index of graphic design work: food and restaurant, menu, branding, packaging, print, editorial, signage and information design. Phnom Penh.",
        ogDescription: "An index of graphic design work, organised by category.",
        themeColor: "#ffffff",
        favicon: "/favicon.svg",
        footerHref: "https://t.me/hiroki_pp",
        footerLabel: "Telegram / @hiroki_pp",
      };

  const replacements = {
    BRAND_ID: cijd ? "cijd" : "hrk",
    BRAND_LABEL: brand.label,
    BRAND_META_TITLE: brand.title,
    BRAND_META_DESCRIPTION: brand.description,
    BRAND_OG_DESCRIPTION: brand.ogDescription,
    BRAND_THEME_COLOR: brand.themeColor,
    BRAND_FAVICON: brand.favicon,
    BRAND_FOOTER_HREF: brand.footerHref,
    BRAND_FOOTER_LABEL: brand.footerLabel,
  };

  return {
    base: cijd ? "/" : command === "build" || isPreview ? "/hrk-design-portfolio/" : "/",
    plugins: [
      {
        name: "portfolio-brand-html",
        transformIndexHtml(html) {
          const branded = Object.entries(replacements).reduce(
            (result, [key, value]) => result.replaceAll(`__${key}__`, value),
            html,
          );
          if (!cijd) return branded;
          const canonical = "https://portfolio-2026-refresh.cijd-design-portfolio-preview.pages.dev/";
          return branded.replace(
            "</head>",
            `  <meta property="og:url" content="${canonical}" />\n  <link rel="canonical" href="${canonical}" />\n</head>`,
          );
        },
      },
    ],
  };
});
