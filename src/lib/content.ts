/* Logique de contenu partagée par les pages. Le rendu Markdown, les lecteurs vidéo et les
   playlists restent dans tools/build-content.mjs (même sortie HTML que l'ancien build, et
   build-images.mjs s'en sert encore) : on les réexporte plutôt que de les dupliquer. */
export { renderMarkdown, typo, videoEmbed, playlistEmbed } from "../../tools/build-content.mjs";

// `assets/x` → `/assets/x` ; les URL absolues (https:, //, data:) et les chemins déjà absolus passent tels quels.
export const asset = (path: string): string =>
  /^([a-z][a-z0-9+.-]*:|\/)/i.test(path) ? path : `/${path}`;

// Pseudo-aléa déterministe : les vignettes du Coin lecture gardent la même mise en page à chaque build.
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
