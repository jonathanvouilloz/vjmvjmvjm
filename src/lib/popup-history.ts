/* Pile d'historique des pop-ups sans URL (aléa, news, « i » d'album, œil de la bio, menu ≡) :
   l'ouverture pousse une entrée, le bouton retour la referme.

   Le ClientRouter écoute aussi popstate. On stoppe l'événement chaque fois qu'il ne concerne
   qu'une pop-up, sinon « retour » rechargerait la page courante (même URL, même index) et ferait
   sauter le défilement. Il faut passer avant lui : Base.astro pose, avant le routeur, un
   écouteur qui appelle `window.__vjmPopstate` (l'ordre d'enregistrement fait foi sur window).
   L'entrée poussée copie l'état du routeur (index, scroll) et ajoute `vjmPopup`. */
let current: (() => void) | null = null; // fermeture de la pop-up ouverte
let onEntry = false; // on se trouve sur l'entrée poussée par une pop-up
let closing = false; // un history.back() de fermeture est déjà parti
let page = ""; // URL de la page qui porte l'entrée : seul son popstate nous concerne
let after: (() => void) | undefined; // à faire une fois la pop-up refermée

/* Oublie tout : après une navigation, l'entrée poussée appartient à une autre page. */
function reset() {
  const close = current;
  current = null; onEntry = false; closing = false; after = undefined; page = "";
  close?.();
}

if (typeof window !== "undefined") {
  onEntry = !!history.state?.vjmPopup; // rechargement sur une entrée de pop-up
  if (onEntry) page = location.href;
  (window as any).__vjmPopstate = (e: PopStateEvent) => {
    const wasOn = onEntry;
    onEntry = !!e.state?.vjmPopup;
    // une autre page, ou rien d'ouvert : navigation ordinaire, au routeur
    if (location.href !== page || (!current && !wasOn && !onEntry)) { if (current) reset(); return; }
    e.stopImmediatePropagation();
    if (current && !onEntry) {
      const close = current, next = after;
      current = null; closing = false; after = undefined;
      close();
      next?.();
    } else if (!current && onEntry) history.back(); // « avant » vers une entrée orpheline
  };
  // Navigation avec une pop-up ouverte (clavier, lien) : on la ferme et on repart de zéro.
  document.addEventListener("astro:before-swap", reset);
}

export function openEntry(onClose: () => void) {
  history.pushState({ ...history.state, vjmPopup: true }, "");
  onEntry = true; closing = false;
  page = location.href;
  current = onClose;
}

/* `then` : à exécuter une fois refermée (ex. naviguer depuis le menu sans laisser d'entrée orpheline).
   Ré-entrant : ✕ + clic parasite ou double Échap ne font qu'un seul retour arrière. */
export function requestClose(then?: () => void) {
  if (!current) return then?.();
  if (closing) return;
  closing = true;
  after = then;
  history.back();
}

export const isOpen = () => current !== null;
