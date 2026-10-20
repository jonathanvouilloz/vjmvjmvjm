/* Pile d'historique des pop-ups sans URL (aléa, news, « i » d'album, œil de la bio, menu ≡) :
   l'ouverture pousse une entrée, le bouton retour la referme.

   Le ClientRouter écoute aussi popstate. On stoppe l'événement chaque fois qu'il ne concerne
   qu'une pop-up, sinon « retour » rechargerait la page courante (même URL, même index) et ferait
   sauter le défilement. Il faut passer avant lui : Base.astro pose, avant le routeur, un
   écouteur qui appelle `window.__vjmPopstate` (l'ordre d'enregistrement fait foi sur window).
   L'entrée poussée copie l'état du routeur (index, scroll) et ajoute `vjmPopup`. */
let current: (() => void) | null = null; // fermeture de la pop-up ouverte
let onEntry = false; // on se trouve sur l'entrée poussée par une pop-up
let after: (() => void) | undefined; // à faire une fois la pop-up refermée

if (typeof window !== "undefined") {
  onEntry = !!history.state?.vjmPopup; // rechargement sur une entrée de pop-up
  (window as any).__vjmPopstate = (e: PopStateEvent) => {
    const wasOn = onEntry;
    onEntry = !!e.state?.vjmPopup;
    if (!current && !wasOn && !onEntry) return; // navigation ordinaire : au routeur
    e.stopImmediatePropagation();
    if (current && !onEntry) {
      const close = current;
      current = null;
      close();
      const next = after;
      after = undefined;
      next?.();
    } else if (!current && onEntry) history.back(); // « avant » vers une entrée orpheline
  };
}

export function openEntry(onClose: () => void) {
  history.pushState({ ...history.state, vjmPopup: true }, "");
  onEntry = true;
  current = onClose;
}

/* `then` : à exécuter une fois refermée (ex. naviguer depuis le menu sans laisser d'entrée orpheline). */
export function requestClose(then?: () => void) {
  if (!current) return then?.();
  after = then;
  history.back();
}

export const isOpen = () => current !== null;
