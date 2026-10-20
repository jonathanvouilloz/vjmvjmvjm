/* Lecture du manifeste écrit par tools/build-images.mjs : chemin du CMS → { src, w, h, thumb? }. */
import manifest from "../generated/images.json";
import { asset } from "./content";

export type Img = { src: string; w: number; h: number; thumb?: string };

const entries = manifest as Record<string, Img>;
// Même normalisation que `clean` de build-images.mjs
const clean = (p: string) => p.trim().replace(/^\/+/, "");

/* Dimensions + src absolue, ou null si l'image n'est pas au manifeste (introuvable au build). */
export function image(path: string): Img | null {
  const e = entries[clean(path)];
  return e && { ...e, src: asset(e.src), ...(e.thumb ? { thumb: asset(e.thumb) } : {}) };
}

// Vignette d'un film Kinematik : celle du CMS, sinon `assets/kinematik/{id}.jpg`.
export const kinematikImage = (film: { id: string; vignette?: string }) =>
  image(film.vignette || `assets/kinematik/${film.id}.jpg`);

// Images collées dans un texte Markdown : `src="/assets/x.jpg"` → variante réduite du manifeste, comme l'ancien build.
export const withImageVariants = (html: string): string =>
  html.replace(/(<img [^>]*?src=")([^"]+)"/g, (whole, pre, src) => {
    const e = entries[clean(src)];
    return e ? `${pre}${asset(e.src)}"` : whole;
  });
