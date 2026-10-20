/* Logique de contenu partagée par les pages. Le rendu Markdown, les lecteurs vidéo et les
   playlists restent dans tools/build-content.mjs (même sortie HTML que l'ancien build, et
   build-images.mjs s'en sert encore) : on les réexporte plutôt que de les dupliquer. */
export { renderMarkdown, typo, videoEmbed, playlistEmbed } from "../../tools/build-content.mjs";

// `assets/x` → `/assets/x` ; les URL absolues (https:, //, data:) et les chemins déjà absolus passent tels quels.
export const asset = (path: string): string =>
  /^([a-z][a-z0-9+.-]*:|\/)/i.test(path) ? path : `/${path}`;
