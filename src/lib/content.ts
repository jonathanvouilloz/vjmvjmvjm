/* Logique de contenu partagée par les pages : rendu Markdown, lecteurs vidéo, playlists, chemins d'images.

   Toute propriété Markdown est rendue ici, au build : le site n'embarque aucun parseur et le
   contenu reste lisible et éditable tel quel dans les fichiers du CMS.
   Notes de bas de page : `[^1]` dans le texte renvoie à `notes[0]` du document. */
import { Marked } from "marked";

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    // Tout lien sortant s'ouvre à côté : une page de lecture ou un lecteur ouvert dans l'onglet
    // serait perdu en sortant du site.
    link(this: any, { href, title, tokens }: any) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      const t = title ? ` title="${title}"` : "";
      const ext = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}"${t}${ext}>${text}</a>`;
    },
  },
});

const footnoteRefs = (html: string) =>
  html.replace(/\[\^(\d+)\]/g, (_, n: string) =>
    `<sup class="fn-ref"><a href="#note-${n}" id="ref-${n}" data-fn="${n}">${n}</a></sup>`);

// Typographie française : les guillemets et la ponctuation haute ne se retrouvent jamais
// seuls en début ou en fin de ligne.
export const typo = (text?: string): string => (text || "")
  .replace(/« /g, "«\u00A0")
  .replace(/ »/g, "\u00A0»")
  .replace(/ ([?!:;])/g, "\u202F$1");

const escapeAttr = (s: string) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const unescapeAttr = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"');

// Une URL Vimeo ou YouTube seule sur sa ligne devient un lecteur : c'est la seule façon
// d'intégrer une vidéo depuis l'éditeur riche du CMS, sans composant sur mesure.
export function videoEmbed(url: string): string | null {
  let u: URL;
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

const mediaParagraphs = (html: string) => html
  .replace(/<p><a href="([^"]+)"[^>]*>[^<]*<\/a><\/p>/g, (whole: string, href: string) => {
    const src = videoEmbed(unescapeAttr(href));
    return src
      ? `<figure class="vjm-video"><iframe src="${escapeAttr(src)}" title="Vidéo" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></figure>`
      : whole;
  })
  // image seule dans son paragraphe → figure ; le titre Markdown sert de légende
  .replace(/<p>(<img [^>]*?)(?: title="([^"]*)")?>\s*<\/p>/g, (_: string, img: string, title?: string) =>
    `<figure>${img} loading="lazy">${title ? `<figcaption>${title}</figcaption>` : ""}</figure>`);

// Le CMS écrit `assets/…` sans barre initiale : relatif, il casserait sous /lecture/… ou /films/….
const absoluteAssets = (html: string) => html.replace(/(<img [^>]*?src=")assets\//g, "$1/assets/");

// Remplace le `src` des <img> par celui que donne `variant` (undefined = on garde l'original).
export const swapImageSrcs = (html: string, variant: (path: string) => string | undefined): string =>
  html.replace(/(<img [^>]*?src=")([^"]+)"/g, (whole, pre: string, src: string) => {
    const v = variant(src);
    return v ? `${pre}${asset(v)}"` : whole;
  });

export const renderMarkdown = (md: string): string =>
  footnoteRefs(absoluteAssets(mediaParagraphs(marked.parse(typo(md)) as string))).trim();

/* Playlists des albums : la plateforme est choisie dans une liste fixe du CMS, l'URL est
   celle qu'on copie dans la barre d'adresse. Le build en tire l'URL du lecteur intégré ;
   `null` = la plateforme n'en propose pas, le site affiche un lien. */
export function playlistEmbed({ plateforme, url }: { plateforme: string; url: string }): { embed: string; hauteur: number | null } | null {
  let u: URL;
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

// `assets/x` → `/assets/x` ; les URL absolues (https:, //, data:) et les chemins déjà absolus passent tels quels.
export const asset = (path: string): string =>
  /^([a-z][a-z0-9+.-]*:|\/)/i.test(path) ? path : `/${path}`;

// Adresse d'un film Kinematik (page créée en Tâche 6) ; l'unicité est vérifiée par la collection.
export const filmUrl = (film: { id: string; data: { slug?: string } }): string => `/kinematik/${film.data.slug || film.id}`;
