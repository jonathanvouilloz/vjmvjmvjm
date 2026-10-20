/* Ouverture des pop-ups sans URL, par délégation sur document (le module ne s'exécute qu'une
   fois sous ClientRouter, et l'en-tête est persisté). L'historique : src/lib/popup-history.ts. */
import { openEntry, requestClose, isOpen } from "../lib/popup-history";

function mount(el: HTMLElement, focusEl: HTMLElement | null, restoreFocus?: () => void) {
  document.body.append(el);
  focusEl?.focus();
  // deux frames : la transition part de l'état initial
  requestAnimationFrame(() => requestAnimationFrame(() => el.setAttribute("data-show", "")));
  openEntry(() => { el.remove(); restoreFocus?.(); });
}

function closeButton(cls: string) {
  const b = document.createElement("button");
  b.type = "button"; b.className = cls; b.setAttribute("aria-label", "Fermer"); b.textContent = "×";
  b.addEventListener("click", () => requestClose());
  return b;
}

function openPopup(id: string, trigger: HTMLElement) {
  const tpl = document.getElementById(id) as HTMLTemplateElement | null;
  if (!tpl) return;
  const back = document.createElement("div");
  back.className = "vjm-popup";
  back.setAttribute("role", "dialog");
  back.setAttribute("aria-modal", "true");
  back.setAttribute("aria-label", tpl.dataset.label || "");
  back.append(tpl.content.cloneNode(true));
  const close = closeButton("vjm-popup-close");
  back.firstElementChild?.querySelector(".vjm-popup-body")?.before(close);
  back.addEventListener("click", (e) => { if (e.target === back) requestClose(); });
  mount(back, close, () => trigger.focus());
}

/* Aléa du jour : une image tirée au hasard à chaque clic, jamais au chargement. */
function openAlea(btn: HTMLElement) {
  let pool: string[] = [];
  try { pool = JSON.parse(btn.dataset.aleas || "[]"); } catch {}
  const src = pool[Math.floor(Math.random() * pool.length)];
  if (!src) return;
  const back = document.createElement("div");
  back.className = "vjm-alea";
  back.setAttribute("role", "dialog");
  back.setAttribute("aria-modal", "true");
  back.setAttribute("aria-label", "Aléa du jour");
  const close = closeButton("vjm-alea-close");
  const img = document.createElement("img");
  img.src = src; img.alt = "Aléa du jour";
  back.append(close, img);
  back.addEventListener("click", (e) => { if (e.target === back) requestClose(); });
  const overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  mount(back, close, () => { document.body.style.overflow = overflow; btn.focus(); });
}

document.addEventListener("click", (e) => {
  const t = (e.target as Element).closest<HTMLElement>("button[data-news], button[data-album-info], button[data-bio-perso], button[data-alea]");
  if (!t || isOpen()) return;
  if (t.hasAttribute("data-alea")) openAlea(t);
  else if (t.hasAttribute("data-news")) openPopup(`popup-news-${t.dataset.news}`, t);
  else if (t.hasAttribute("data-album-info")) openPopup(`popup-album-${t.dataset.albumInfo}`, t);
  else openPopup("popup-bio-perso", t);
});

document.addEventListener("keydown", (e) => {
  if (!isOpen()) return;
  if (e.key === "Escape") requestClose();
  // aléa seulement : le focus reste sur la croix, comme l'ancien piège à Tab
  else if (e.key === "Tab") {
    const c = document.querySelector<HTMLElement>(".vjm-alea-close");
    if (c) { e.preventDefault(); c.focus(); }
  }
});
