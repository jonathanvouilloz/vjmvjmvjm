/* Le collage /carnets et les pages /carnets/{slug} (Tâche 6) partent de la même liste ordonnée. */
import path from "node:path";
import { getCollection, getEntry } from "astro:content";
import { seededRandom } from "./random";
import { image, type Img } from "./images";

export type Carnet = { path: string; slug: string; title?: string; img: Img };

/* Carnets + photos d'accueil, une image listée deux fois n'y figure qu'une fois (à la place du
   carnet, mais avec la valeur de la photo, donc sans titre : comme l'ancien `new Map`), puis
   entrelacés par une clé pseudo-aléatoire stable. Une image absente du manifeste est écartée. */
export async function carnetsAll(): Promise<Carnet[]> {
  const clean = (p: string) => p.trim().replace(/^\/+/, "");
  const carnets = (await getCollection("carnets")).map((c) => ({ path: clean(c.data.image), title: c.data.titre }));
  const photos = (await getEntry("accueil", "accueil"))!.data.photos.map((p) => ({ path: clean(p), title: undefined }));
  const unique = [...new Map([...carnets, ...photos].map((c) => [c.path, c])).values()];

  const list: Carnet[] = [];
  const slugs = new Map<string, string>();
  for (const c of unique) {
    const img = image(c.path);
    if (!img) continue;
    let slug = path.basename(c.path, path.extname(c.path));
    // Même nom dans deux dossiers : le second prend son dossier en préfixe (stable, contrairement à un numéro d'ordre).
    if (slugs.has(slug)) slug = `${path.basename(path.dirname(c.path))}-${slug}`;
    if (slugs.has(slug)) throw new Error(`deux images à l'adresse /carnets/${slug} : ${slugs.get(slug)} et ${c.path}`);
    slugs.set(slug, c.path);
    list.push({ path: c.path, slug, title: c.title || undefined, img });
  }
  return list
    .map((item, i) => ({ item, k: seededRandom(i * 7 + 3) }))
    .sort((a, b) => a.k - b.k)
    .map((e) => e.item);
}
