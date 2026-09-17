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

export const renderMarkdown = (md) => footnoteRefs(marked.parse(typo(md))).trim();

function convert(node) {
  if (Array.isArray(node)) return node.map(convert);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = convert(v);
    if (typeof node.md === "string") out.html = renderMarkdown(node.md);
    if (typeof node.extrait === "string") out.extrait = typo(node.extrait);
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
