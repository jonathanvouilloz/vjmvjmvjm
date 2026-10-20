/* Sigles décoratifs autour des titres de section et sections du menu, partagés par les
   composants Astro et l'île du menu. Dessins de Vania (tools/import-vector-sigles.py), sauf
   le contact où elle a demandé un avion (`glyph`), le second retourné. */
type SigleDef = { left?: string; right?: string; glyph?: string; mirror?: boolean };

const SIGLES: Record<string, SigleDef> = {
  kinematik: { left: "/assets/brand/sigle-camera-1.svg", right: "/assets/brand/sigle-camera-2.svg" },
  films: { left: "/assets/brand/sigle-spirale-1.svg", right: "/assets/brand/sigle-spirale-2.svg" },
  carnets: { left: "/assets/brand/nav-eye-left.svg", right: "/assets/brand/nav-eye-right.svg" },
  lecture: { left: "/assets/brand/sigle-etoile-1.svg", right: "/assets/brand/sigle-etoile-2.svg" },
  contact: { glyph: "✈", mirror: true },
};

// Sections du menu : même source pour la page Menu et le déroulant ≡.
export const SECTIONS_MENU = [
  { id: "kinematik", label: "Kinematik" },
  { id: "films", label: "Films pour les oreilles" },
  { id: "carnets", label: "Carnets de voyages" },
  { id: "lecture", label: "Coin lecture" },
];

/* `flip` désigne l'exemplaire de gauche : il retourne le dessin (l'avion du contact) ou
   choisit le fichier prévu pour ce côté (les caméras). */
export function sigleSource(id: string, flip: boolean) {
  const s = SIGLES[id];
  if (!s) return null;
  return {
    src: flip ? (s.left || s.right) : (s.right || s.left),
    glyph: s.glyph,
    transform: flip && s.mirror ? "scaleX(-1)" : "none",
  };
}
