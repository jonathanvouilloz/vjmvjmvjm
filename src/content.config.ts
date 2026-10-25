/* Collections du site : elles lisent `content/` tel que le CMS l'écrit, sans rien y changer.
   Les schémas sont le miroir de public/admin/config.yml : un JSON qui ne colle pas fait
   échouer le build, avec le fichier et le champ en cause. */
import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { z } from "astro/zod";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Entry = { id: string } & Record<string, unknown>;

/* Lit `content/{name}.json` ; `entries` en tire la liste des entrées. Remplace le loader
   `file` d'Astro, qui journalise un JSON illisible ou un doublon puis continue avec une
   collection vide : le site partirait sans films. Ici, tout problème arrête le build.
   shortcut: pas de rechargement à chaud en `astro dev` quand le JSON change, relancer le
   serveur ; à ajouter (watcher du LoaderContext) si on édite souvent content/ en local. */
function json(name: string, entries: (data: any) => Entry[]): Loader {
  const filePath = `content/${name}.json`;
  return {
    name: `json:${name}`,
    load: async ({ store, parseData }) => {
      let items: Entry[];
      try {
        items = entries(JSON.parse(await readFile(filePath, "utf8")));
      } catch (error) {
        throw new Error(`${filePath} : ${(error as Error).message}`);
      }
      store.clear();
      for (const { id, ...data } of items) {
        if (!id) throw new Error(`${filePath} : une entrée sans identifiant`);
        if (store.has(id)) throw new Error(`${filePath} : identifiant en double « ${id} »`);
        store.set({ id, data: await parseData({ id, data, filePath }), filePath });
      }
    },
  };
}

// Fichier d'un seul tenant (réglages, bio…) : une collection d'une entrée, du nom du fichier.
const single = (name: string) => json(name, (data) => [{ id: name, ...data }]);

const image = z.string();
const blocks = z.array(z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), md: z.string(), variante: z.string().optional() }),
  z.object({ type: z.literal("image"), src: image, alt: z.string().optional(), legende: z.string().optional() }),
  z.object({ type: z.literal("video"), vimeoId: z.string().optional(), url: z.string().optional(), legende: z.string().optional() }),
  z.object({ type: z.literal("audio"), src: z.string(), titre: z.string().optional() }),
  z.object({ type: z.literal("lien"), label: z.string(), url: z.string() }),
]));
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const site = defineCollection({
  loader: single("site"),
  schema: z.object({
    email: z.string(),
    iban: z.string(),
    description: z.string().max(200),
    bioOeilVisible: z.boolean().default(true),
    policeMenu: z.enum(["Open Sans", "Manrope", "Work Sans", "IBM Plex Sans", "Space Grotesk"]).default("Open Sans"),
    social: z.array(z.object({ id: z.enum(["instagram", "facebook", "vimeo", "spotify"]), label: z.string(), url: z.string() })),
  }),
});

const bioLang = { pro: blocks, perso: blocks };
const bio = defineCollection({
  loader: single("bio"),
  schema: z.object({
    fr: z.object(bioLang),
    en: z.object({ aValider: z.boolean().default(false), ...bioLang }),
    portraits: z.array(image),
  }),
});

const accueil = defineCollection({ loader: single("accueil"), schema: z.object({ photos: z.array(image) }) });
const aleas = defineCollection({ loader: single("aleas"), schema: z.object({ aleas: z.array(image) }) });

const news = defineCollection({
  loader: json("news", (data) => data.news),
  schema: z.object({
    actif: z.boolean().default(true),
    titre: z.string(),
    debut: day,
    fin: day,
    mode: z.enum(["popup", "lien"]).default("popup"),
    url: z.string().optional(),
    blocks: blocks.optional(),
  }),
});

const kinematik = defineCollection({
  // L'URL d'un film est /kinematik/{slug || id} : deux films à la même adresse arrêtent le build.
  loader: json("kinematik", (data) => {
    const seen = new Set();
    for (const f of data.films) {
      const url = f.slug || f.id;
      if (seen.has(url)) throw new Error(`deux films à l'adresse /kinematik/${url}`);
      seen.add(url);
    }
    return data.films;
  }),
  schema: z.object({
    titre: z.string(),
    slug: z.string().regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/).optional(),
    vignette: image.optional(),
    sousTitre: z.string().optional(),
    duree: z.string(),
    annee: z.number().int(),
    vimeoId: z.string(),
    hash: z.string().optional(),
    trailer: z.boolean().default(false),
    mention: z.string().optional(),
    information: z.string().max(300).optional(),
    resume: blocks.optional(),
    generique: z.array(z.object({ role: z.string(), noms: z.string() })).optional(),
  }),
});

const albums = defineCollection({
  loader: json("albums", (data) => data.albums),
  schema: z.object({
    titre: z.string(),
    resume: z.string().max(300).optional(),
    playlists: z.array(z.object({
      plateforme: z.enum(["spotify", "apple-music", "apple-podcasts", "deezer", "youtube", "soundcloud", "bandcamp", "amazon-music", "autre"]),
      libelle: z.string().optional(),
      langue: z.enum(["fr", "en", "es", "de", "it", "pt"]).default("fr"),
      url: z.string(),
    })).optional(),
    contenu: z.string().optional(),
    episodes: z.array(z.object({
      id: z.number().int(),
      title: z.string(),
      duration: z.string(),
      sec: z.number().int(),
      src: z.string(),
    })).optional(),
  }),
});

const carnets = defineCollection({
  // Pas d'identifiant dans le CMS : l'URL /carnets/{id} vient du nom du fichier image ; deux
  // fichiers de même nom (dans deux dossiers) arrêtent le build sur un doublon d'id.
  loader: json("carnets", (data) => data.carnets.map((c: { image: string }) =>
    ({ id: path.basename(c.image, path.extname(c.image)), ...c }))),
  schema: z.object({ image, titre: z.string().optional() }),
});

const lecture = defineCollection({
  // id = nom du fichier, comme le CMS le crée (content/lecture/{slug}.json)
  loader: glob({ pattern: "*.json", base: "content/lecture", generateId: ({ entry }) => entry.replace(/\.json$/, "") }),
  schema: z.object({
    titre: z.string(),
    surtitre: z.string().optional(),
    publie: z.boolean().default(true),
    ordre: z.number().int().default(1),
    contexte: z.string().optional(),
    contextePosition: z.enum(["haut", "bas"]).default("haut"),
    vignette: z.object({
      type: z.enum(["titre", "extrait", "image"]).default("titre"),
      extrait: z.string().max(300).optional(),
      image: image.optional(),
    }),
    corps: z.string(),
    notes: z.array(z.object({ md: z.string() })).optional(),
  }),
});

/* Articles de news (≠ `news`, l'annonce datée sous le nom) : un fichier par article. Le menu
   affiche le plus récent publié sous le pli. */
const articles = defineCollection({
  loader: glob({ pattern: "*.json", base: "content/articles", generateId: ({ entry }) => entry.replace(/\.json$/, "") }),
  schema: z.object({
    titre: z.string(),
    date: day,
    publie: z.boolean().default(true),
    image: image.optional(),
    corps: z.string(),
  }),
});

export const collections = { site, bio, accueil, aleas, news, kinematik, albums, carnets, lecture, articles };
