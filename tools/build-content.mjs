/* build-content.mjs — lit `content/` (les fichiers que le CMS éditera) et rend un objet
   prêt à poser sur `window.CONTENT`.

   Une seule règle de conversion : toute propriété `md` reçoit une sœur `html`, rendue ici
   au build. Le site n'embarque donc aucun parseur Markdown, et le contenu reste lisible
   et éditable tel quel dans les fichiers.

   Notes de bas de page : `[^1]` dans le texte renvoie à `notes[0]` du document. */
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    // Tout lien sortant s'ouvre à côté : le site est une page unique, en sortir fait perdre
    // la lecture en cours.
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      const t = title ? ` title="${title}"` : "";
      const ext = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}"${t}${ext}>${text}</a>`;
    },
  },
});

const footnoteRefs = (html) =>
  html.replace(/\[\^(\d+)\]/g, (_, n) =>
    `<sup class="fn-ref"><a href="#note-${n}" id="ref-${n}" data-fn="${n}">${n}</a></sup>`);

// Typographie française : les guillemets et la ponctuation haute ne se retrouvent jamais
// seuls en début ou en fin de ligne.
export const typo = (text) => (text || "")
  .replace(/« /g, "«\u00A0")
  .replace(/ »/g, "\u00A0»")
  .replace(/ ([?!:;])/g, "\u202F$1");

const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const unescapeAttr = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"');

// Une URL Vimeo ou YouTube seule sur sa ligne devient un lecteur : c'est la seule façon
// d'intégrer une vidéo depuis l'éditeur riche du CMS, sans composant sur mesure.
export function videoEmbed(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "vimeo.com") {
    const m = u.pathname.match(/^\/(\d+)(?:\/([0-9a-f]+))?/);
    if (!m) return null;
    return `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ""}`;
  }
  const yt = host === "youtu.be" ? u.pathname.slice(1)
    : /(^|\.)youtube\.com$/.test(host) && u.pathname === "/watch" ? u.searchParams.get("v")
    : null;
  return yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}` : null;
}

const mediaParagraphs = (html) => html
  .replace(/<p><a href="([^"]+)"[^>]*>[^<]*<\/a><\/p>/g, (whole, href) => {
    const src = videoEmbed(unescapeAttr(href));
    return src
      ? `<figure class="vjm-video"><iframe src="${escapeAttr(src)}" title="Vidéo" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></figure>`
      : whole;
  })
  // image seule dans son paragraphe → figure ; le titre Markdown sert de légende
  .replace(/<p>(<img [^>]*?)(?: title="([^"]*)")?>\s*<\/p>/g, (_, img, title) =>
    `<figure>${img} loading="lazy">${title ? `<figcaption>${title}</figcaption>` : ""}</figure>`);

export const renderMarkdown = (md) => footnoteRefs(mediaParagraphs(marked.parse(typo(md)))).trim();

/* Playlists des albums : la plateforme est choisie dans une liste fixe du CMS, l'URL est
   celle qu'on copie dans la barre d'adresse. Le build en tire l'URL du lecteur intégré ;
   `null` = la plateforme n'en propose pas, le site affiche un lien. */
export function playlistEmbed({ plateforme, url }) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  switch (plateforme) {
    case "spotify": {
      const m = u.pathname.match(/^(?:\/intl-[a-z-]+)?(?:\/embed)?\/(playlist|album|show|episode|track|artist)\/([A-Za-z0-9]+)/);
      return m ? { embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`, hauteur: 352 } : null;
    }
    case "apple-music":
      return /music\.apple\.com$/.test(host) ? { embed: `https://embed.music.apple.com${u.pathname}${u.search}`, hauteur: 450 } : null;
    case "apple-podcasts":
      return /podcasts\.apple\.com$/.test(host) ? { embed: `https://embed.podcasts.apple.com${u.pathname}${u.search}`, hauteur: 450 } : null;
    case "deezer": {
      const m = u.pathname.match(/\/(playlist|album|show|artist|track|episode)\/(\d+)/);
      return m ? { embed: `https://widget.deezer.com/widget/auto/${m[1]}/${m[2]}`, hauteur: 300 } : null;
    }
    case "youtube": {
      const list = u.searchParams.get("list");
      return list ? { embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`, hauteur: null } : null;
    }
    case "soundcloud":
      return /soundcloud\.com$/.test(host)
        ? { embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`, hauteur: 300 }
        : null;
    default:
      return null;
  }
}

// Champs Markdown d'un seul tenant (éditeur riche du CMS) : `corps` → `corpsHtml`.
const RICH = ["corps", "contenu"];
// Textes courts affichés tels quels : seule la typographie est corrigée.
const PLAIN = ["extrait", "resume", "information"];

function convert(node) {
  if (Array.isArray(node)) return node.map(convert);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = convert(v);
    if (typeof node.md === "string") out.html = renderMarkdown(node.md);
    for (const k of RICH) if (typeof node[k] === "string") out[`${k}Html`] = renderMarkdown(node[k]);
    for (const k of PLAIN) if (typeof node[k] === "string") out[k] = typo(node[k]).trim();
    if (Array.isArray(node.playlists)) {
      out.playlists = node.playlists
        .filter((p) => p && p.url)
        .map((p) => ({ ...p, ...(playlistEmbed(p) || { embed: null, hauteur: null }) }));
    }
    return out;
  }
  return node;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

export function loadContent(dir = "content") {
  const lectureDir = path.join(dir, "lecture");
  const lecture = fs.existsSync(lectureDir)
    ? fs.readdirSync(lectureDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ id: path.basename(f, ".json"), ...readJson(path.join(lectureDir, f)) }))
      .filter((t) => t.publie !== false)
      .sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999) || a.titre.localeCompare(b.titre))
    : [];
  return convert({
    site: readJson(path.join(dir, "site.json")),
    bio: readJson(path.join(dir, "bio.json")),
    kinematik: readJson(path.join(dir, "kinematik.json")).films,
    albums: readJson(path.join(dir, "albums.json")).albums,
    news: readJson(path.join(dir, "news.json")).news,
    lecture,
  });
}
