import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://vjmvjmvjm.com",
  output: "static",
  // menu.html plutôt que menu/index.html : Netlify sert /menu sans redirection vers /menu/, comme les canoniques.
  build: { format: "file" },
  integrations: [react(), sitemap({ filter: (p) => !/\/carnets\/[^/]+\/?$/.test(p) && !/\/404\/?$/.test(p) })],
});
