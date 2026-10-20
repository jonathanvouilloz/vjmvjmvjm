// Pseudo-aléa déterministe (sans import Node : l'île DotField l'embarque dans le navigateur).
// Les vignettes et le semis de points gardent la même mise en page à chaque build.
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
