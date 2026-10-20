/* Fenêtre de dates d'une annonce, bornes incluses, jour en UTC (AAAA-MM-JJ) : partagée par le
   rendu au build et le script de l'en-tête pour qu'elles ne divergent pas. */
export const inWindow = (n: { debut?: string; fin?: string }, d: string) =>
  (!n.debut || n.debut <= d) && (!n.fin || d <= n.fin);

export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);
