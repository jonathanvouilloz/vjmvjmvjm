import { transformSync } from "@babel/core";
import presetReact from "@babel/preset-react";
import fs from "node:fs";
import path from "node:path";

// `node precompile.mjs`        → build de travail à la racine (panneau Tweaks inclus + auto-ouvert)
// `node precompile.mjs --prod` → build de déploiement dans dist/ (sans Tweaks, assets copiés)
const PROD = process.argv.includes("--prod");
const OUT = PROD ? "dist" : ".";

const PROJ = "design-extract/site-minimalist-portoflio/project";
const read = (p) => fs.readFileSync(p, "utf8");
const wrap = (name, src) => `\n/* === ${name} === */\n;(function(){\n${src}\n})();\n`;

const tweaks = read(`${PROJ}/tweaks-panel.jsx`);
const assets = read(`${PROJ}/waniushka-assets.jsx`);
const comps  = read(`${PROJ}/waniushka-components.jsx`);
const app    = read(`${PROJ}/waniushka-app.jsx`);

// `waniushka-assets.jsx` est généré par tools/import-images.py et pose l'inventaire des
// images sur `window` — il passe donc AVANT les composants, qui le lisent au chargement.
// Le panneau Tweaks n'est plus utilisé par l'app (aucune référence dans app/components) :
// on le laisse hors du bundle de prod.
const source = (PROD ? "" : wrap("tweaks-panel.jsx", tweaks))
  + wrap("waniushka-assets.jsx", assets)
  + wrap("waniushka-components.jsx", comps) + wrap("waniushka-app.jsx", app);

const { code } = transformSync(source, {
  presets: [[presetReact, { runtime: "classic" }]],
  babelrc: false,
  configFile: false,
});

// Auto-open the Tweaks panel in standalone (no edit-host parent).
const activate = PROD ? "" : `
if (window.parent === window) {
  window.addEventListener('load', function () {
    setTimeout(function () { window.postMessage({ type: '__activate_edit_mode' }, '*'); }, 100);
  });
}
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/waniushka.bundle.js`, code + "\n" + activate, "utf8");

let html = read(`${PROJ}/Waniushka Portfolio.html`);
// Remove the three text/babel script tags + babel.min.js, replace with one plain script.
html = html.replace(/\s*<script[^>]*babel\.min\.js[^>]*><\/script>/g, "");
html = html.replace(/\s*<script type="text\/babel"[^>]*><\/script>/g, "");
// Switch React UMDs to their pinned production bundles while preserving SRI.
// Hashes were calculated from the exact unpkg payloads named below.
const REACT_PROD_SRI = "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z";
const REACT_DOM_PROD_SRI = "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1";
html = html.replace(
  /react\.development\.js" integrity="[^"]+"/,
  `react.production.min.js" integrity="${REACT_PROD_SRI}"`,
).replace(
  /react-dom\.development\.js" integrity="[^"]+"/,
  `react-dom.production.min.js" integrity="${REACT_DOM_PROD_SRI}"`,
);
if (PROD && (!html.includes(REACT_PROD_SRI) || !html.includes(REACT_DOM_PROD_SRI))) {
  throw new Error("Impossible d’injecter les hashes SRI des bundles React de production");
}
const inject = '  <script src="waniushka.bundle.js" defer></script>\n';
html = html.replace("</body>", inject + "</body>");
fs.writeFileSync(`${OUT}/index.html`, html, "utf8");

// En prod : les assets référencés par le bundle/le CSS partent avec le build.
// Les deux manuscrites sous licence non commerciale ne sont plus chargées par le site
// (la bio est passée en Newsreader, les aléas sont des scans détourés). On garde les
// fichiers et leurs licences dans le dépôt pour l'archive, mais rien ne part en ligne.
const SKIP = /^(LearningCurve|ArsenaleWhite)/;
if (PROD) {
  // Table rase : sans ça, un fichier qu'on cesse de publier (les polices sous licence, une
  // image retirée du dossier de Vania) survit indéfiniment dans dist/ parce que la copie
  // écrase sans jamais supprimer.
  fs.rmSync(`${OUT}/assets`, { recursive: true, force: true });
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, e.name), d = path.join(dest, e.name);
      if (e.isDirectory()) copyDir(s, d);
      else if (!SKIP.test(e.name)) fs.copyFileSync(s, d);
    }
  };
  copyDir("assets", `${OUT}/assets`);
}

console.log("bundle:", fs.statSync(`${OUT}/waniushka.bundle.js`).size, "bytes");
console.log("html:  ", fs.statSync(`${OUT}/index.html`).size, "bytes");
if (PROD) console.log("out:   ", path.resolve(OUT));
