/* Aides SEO : description tirée du contenu, URLs absolues, JSON-LD partagé. */
import { getEntry } from "astro:content";

export const SITE_URL = "https://vjmvjmvjm.com";
export const NAME = "Vania Jaikin Miyazaki";

export const abs = (p: string) => new URL(p, SITE_URL).href;

// Texte brut d'un champ : chaîne, ou liste de blocs (premier bloc texte).
const plain = (v: unknown): string => {
  const raw = typeof v === "string" ? v
    : Array.isArray(v) ? (v.find((b) => b?.type === "text")?.md ?? "") : "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/* Première description non vide parmi les candidats, coupée à ~160 caractères sur une frontière de mot.
   undefined si aucune : Base retombe sur site.description. */
export function describe(...candidates: unknown[]): string | undefined {
  const text = candidates.map(plain).find(Boolean);
  if (!text || text.length <= 160) return text;
  return text.slice(0, 160).replace(/\s+\S*$/, "") + "…";
}

// "2'11\"" ou "12:30" → durée ISO 8601 (PT2M11S) ; undefined si le format est inconnu.
export function isoDuration(d: string): string | undefined {
  const m = d.match(/^(?:(\d+)[h:])?(\d+)['m:]\s*(\d+)?/);
  return m ? `PT${m[1] ? m[1] + "H" : ""}${m[2]}M${m[3] ?? 0}S` : undefined;
}

export const itemList = (items: { name: string; url: string }[]) => ({
  "@type": "ItemList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.url) })),
});

// Person du site : l'accueil et la bio la déclarent, les autres pages la citent.
export async function person() {
  const site = (await getEntry("site", "site"))!.data;
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: NAME,
    alternateName: ["VJM", "Waniushka"],
    url: `${SITE_URL}/`,
    jobTitle: "Réalisatrice, productrice, artiste et curatrice",
    homeLocation: { "@type": "Place", name: "Genève" },
    sameAs: site.social.map((s) => s.url),
  };
}
