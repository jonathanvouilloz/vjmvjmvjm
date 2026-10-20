/* build-images.mjs — prépare au build les images que le CMS référence.

   Les listes d'images vivent dans `content/` (carnets, accueil, aléas, portraits, vignettes
   Kinematik et Coin lecture) : Vania les modifie dans Sveltia, qui dépose ses fichiers dans
   `assets/` (le dossier ouvert dans sa bibliothèque). Une photo de téléphone y arrive en 4000 px et 5 Mo, sans vignette ni
   dimensions connues. Ce module comble l'écart, à chaque build et sans script local :
     · dimensions réelles (le collage et le filtre « paysage » de l'accueil en dépendent),
       orientation EXIF comprise ;
     · version réduite si l'image dépasse la taille d'affichage ;
     · vignette de collage, sauf si une `nom-t.jpg` existe déjà à côté de l'image.

   Les fichiers produits vont dans `public/assets/_gen/` (ignoré par git, copié dans dist/
   avec le reste de `public/`). Leur nom dépend du chemin, de la taille et de la date du fichier
   source : une image inchangée n'est pas retraitée, et ce qui n'est plus référencé est
   supprimé en fin de build.

   Lancé seul (`node tools/build-images.mjs`, avant `astro build`), il écrit le manifeste
   `src/generated/images.json` : chemin du CMS → `{ src, w, h, thumb? }`, lu par le site.

   Une image listée mais introuvable est retirée avec un avertissement plutôt que de casser
   le build : sinon une suppression maladroite dans le CMS bloquerait toute mise en ligne. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const GEN = "assets/_gen";
const THUMB = 700;
const QUALITY = 82;

const clean = (p) => String(p || "").trim().replace(/^\/+/, "");

// Formats affichables tels quels par les navigateurs. Les autres (TIFF, HEIC…) sont
// toujours réencodés en JPEG, même petits.
const WEB = new Set(["jpeg", "png", "webp", "gif", "svg", "avif"]);
// Transparence ou animation : réencoder en JPEG les détruirait (les aléas sont des PNG détourés).
const KEEP = new Set(["png", "gif", "svg"]);

export function createImageBuilder({ root = "." } = {}) {
  const used = new Set();
  const warnings = [];
  // shortcut: une image demandée à deux tailles garde la première ; à revoir si un même
  // fichier sert un jour à deux usages de tailles différentes
  const manifest = {};
  const pending = new Map(); // sortie → promesse : une même variante n'est écrite qu'une fois
  const hashes = new Map();
  const abs = (p) => path.join(root, p);

  // Clé de cache sur le contenu : un clone ou un checkout change les dates, pas les octets.
  const hashOf = (src) => {
    if (!hashes.has(src)) hashes.set(src, crypto.createHash("sha1").update(fs.readFileSync(abs(src))).digest("hex"));
    return hashes.get(src);
  };

  function variant(src, maxSide, suffix) {
    const key = crypto.createHash("sha1").update(`${hashOf(src)}|${maxSide}`).digest("hex").slice(0, 12);
    const out = `${GEN}/${path.basename(src, path.extname(src))}-${key}${suffix}.jpg`;
    used.add(path.basename(out));
    if (!pending.has(out)) {
      pending.set(out, (async () => {
        if (fs.existsSync(abs(out))) return out;
        fs.mkdirSync(abs(GEN), { recursive: true });
        // écriture dans un fichier temporaire : un build interrompu ne laisse pas de JPEG tronqué
        const tmp = `${abs(out)}.${process.pid}.tmp`;
        await sharp(abs(src)).rotate()
          .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
          .flatten({ background: "#ffffff" })
          .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
          .toFile(tmp);
        fs.renameSync(tmp, abs(out));
        return out;
      })());
    }
    return pending.get(out);
  }

  /* `{ src, w, h, thumb? }`, ou null si le fichier manque ou ne se décode pas. `max` = côté
     long affiché ; `thumb` = produire aussi une vignette de collage. */
  async function image(p, { max = 1920, thumb = false } = {}) {
    const src = clean(p);
    if (!src) return null;
    if (!fs.existsSync(abs(src))) {
      warnings.push(`image introuvable, ignorée : ${src}`);
      return null;
    }
    try {
      const meta = await sharp(abs(src)).metadata();
      const turned = (meta.orientation || 1) >= 5;
      const w0 = turned ? meta.height : meta.width;
      const h0 = turned ? meta.width : meta.height;
      const keep = KEEP.has(meta.format);
      const scale = Math.min(1, max / Math.max(w0, h0));
      const convert = !keep && (scale < 1 || turned || !WEB.has(meta.format));
      const out = {
        src: convert ? await variant(src, max, "") : src,
        w: Math.round(w0 * (convert ? scale : 1)),
        h: Math.round(h0 * (convert ? scale : 1)),
      };
      if (thumb) {
        const sibling = src.replace(/(\.[a-z]+)$/i, "-t$1");
        out.thumb = fs.existsSync(abs(sibling)) ? sibling
          : keep || Math.max(w0, h0) <= THUMB ? out.src
          : await variant(src, THUMB, "-t");
      }
      manifest[src] ??= out;
      return out;
    } catch (error) {
      warnings.push(`image illisible, ignorée : ${src} (${error.message})`);
      return null;
    }
  }

  /* Supprime de `assets/_gen/` tout ce que ce build n'a pas référencé. */
  function prune() {
    if (!fs.existsSync(abs(GEN))) return;
    for (const f of fs.readdirSync(abs(GEN))) if (!used.has(f)) fs.rmSync(abs(path.join(GEN, f)));
  }

  return { image, prune, warnings, manifest };
}

// Le chemin sert d'identifiant : deux fichiers de même nom dans deux dossiers (un carnet et
// un dépôt du CMS) ne doivent pas se confondre dans la lightbox, qui retrouve l'image par id.
const idOf = (src) => src;
// Toute image de `assets/` sauf les variantes déjà produites : le CMS dépose où on lui dit.
const UPLOAD = /^assets\/(?!_gen\/)[^"]+\.(jpe?g|png|webp|tiff?|heic)$/i;
// Champs texte : Markdown brut (`md`, `corps`, `contenu`) ou HTML déjà rendu.
const TEXT_KEYS = /^(md|corps|contenu|html|corpsHtml|contenuHtml)$/;

/* Images insérées dans les textes (blocs image, éditeur riche) : réduites à 1600 px aussi,
   sinon une photo de téléphone collée dans un texte partirait en ligne à 5 Mo. */
async function resolveTextImages(node, b) {
  if (Array.isArray(node)) { for (const n of node) await resolveTextImages(n, b); return; }
  if (!node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (k === "src" && typeof v === "string" && UPLOAD.test(clean(v))) {
      node.src = (await b.image(v, { max: 1600 }))?.src || v;
    } else if (TEXT_KEYS.test(k) && typeof v === "string" && v.includes("assets/")) {
      let html = v;
      for (const [, src] of v.matchAll(/(?:src="|\]\()\/?(assets\/[^"\s)]+)/g)) {
        if (!UPLOAD.test(src)) continue;
        const img = await b.image(src, { max: 1600 });
        if (img) html = html.split(`"${src}"`).join(`"${img.src}"`).split(`"/${src}"`).join(`"${img.src}"`);
      }
      node[k] = html;
    } else {
      await resolveTextImages(v, b);
    }
  }
}

/* Résout toutes les images de `content` (listes brutes de `content/`) en place, et renvoie
   les galeries prêtes pour le site. */
export async function resolveImages(content, { root = "." } = {}) {
  const b = createImageBuilder({ root });
  // une image après l'autre : 150 photos de 4000 px décodées en même temps épuiseraient
  // la mémoire de la machine de build
  const many = async (list, map) => {
    const out = [];
    for (const item of list || []) { const r = await map(item); if (r) out.push(r); }
    return out;
  };

  const carnets = await many(content.carnets, async (c) => {
    const img = await b.image(c.image, { max: 1280, thumb: true });
    return img && { id: idOf(clean(c.image)), ...img, ...(c.titre ? { title: c.titre } : {}) };
  });
  const home = await many(content.accueil, async (p) => {
    const img = await b.image(p, { max: 1920, thumb: true });
    return img && { id: idOf(clean(p)), ...img };
  });
  const portraits = await many(content.portraits, async (p) => (await b.image(p, { max: 1200 }))?.src);
  const aleas = await many(content.aleas, async (p) => (await b.image(p, { max: 1600 }))?.src);

  for (const film of content.kinematik) {
    film.vignette = (await b.image(film.vignette || `assets/kinematik/${film.id}.jpg`, { max: 1280 }))?.src || null;
  }
  for (const t of content.lecture) {
    if (t.vignette?.type === "image") {
      const img = await b.image(t.vignette.image, { max: 1280, thumb: true });
      t.vignette = img ? { ...t.vignette, image: img.thumb, w: img.w, h: img.h } : { type: "titre" };
    }
  }

  for (const key of ["bio", "news", "kinematik", "albums", "lecture"]) await resolveTextImages(content[key], b);

  // les listes brutes ne servent plus : seules les galeries résolues partent dans le bundle
  for (const key of ["carnets", "accueil", "portraits", "aleas"]) delete content[key];

  b.prune();
  for (const w of b.warnings) console.warn("⚠", w);
  return { carnets, home, portraits, aleas, manifest: b.manifest };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const optional = (file, key) => (fs.existsSync(file) ? readJson(file)[key] || [] : []);

// Les listes de `content/` dont resolveImages a besoin, telles que le CMS les écrit.
export function loadImageSources(dir = "content") {
  const lectureDir = path.join(dir, "lecture");
  const { portraits = [], ...bio } = readJson(path.join(dir, "bio.json"));
  return {
    bio,
    portraits,
    kinematik: readJson(path.join(dir, "kinematik.json")).films,
    albums: readJson(path.join(dir, "albums.json")).albums,
    news: readJson(path.join(dir, "news.json")).news,
    carnets: optional(path.join(dir, "carnets.json"), "carnets"),
    accueil: optional(path.join(dir, "accueil.json"), "photos"),
    aleas: optional(path.join(dir, "aleas.json"), "aleas"),
    lecture: fs.existsSync(lectureDir)
      ? fs.readdirSync(lectureDir).filter((f) => f.endsWith(".json"))
        .map((f) => ({ id: path.basename(f, ".json"), ...readJson(path.join(lectureDir, f)) }))
        .filter((t) => t.publie !== false)
      : [],
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { manifest } = await resolveImages(loadImageSources("content"), { root: "public" });
  fs.mkdirSync("src/generated", { recursive: true });
  fs.writeFileSync("src/generated/images.json", JSON.stringify(manifest, null, 1));
  console.log(`build-images : ${Object.keys(manifest).length} images dans src/generated/images.json`);
}
