/* Bouton ≡ et son menu déroulant, ancré sous le bouton en haut à droite. Panneau posé sur la
   page, qui reste visible dessous (Vania veut le menu « juste en-dessous, sans changer de page »). */
import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { openEntry, requestClose } from "../lib/popup-history";
import "../styles/menu-dropdown.css";

const BtnIcon = ({ open }) => (
  <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    {open ? (
      <g><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></g>
    ) : (
      <g><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="16" x2="20" y2="16" /></g>
    )}
  </svg>
);

const Sigle = ({ s, flip }) => {
  const side = flip ? s.left : s.right;
  return side.src ? (
    <img src={side.src} alt="" aria-hidden="true" className="vjm-md-sigle" style={{ transform: side.transform }} />
  ) : (
    <span aria-hidden="true" className="vjm-md-sigle" style={{ transform: side.transform }}>{side.glyph}</span>
  );
};

/* `sections` : [{ id, label, href, sigles: { left, right } }], résolues côté Astro. */
export default function MenuDropdown({ sections, secondary }) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  // Ouvert = une entrée d'historique : « retour » le referme. Échap passe par src/scripts/popups.ts.
  useEffect(() => {
    if (!open) { setShow(false); return; }
    openEntry(() => setOpen(false));
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Un lien referme d'abord (retour arrière) puis navigue : pas d'entrée orpheline dans l'historique.
  const onLink = (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    requestClose(() => navigate(a.href));
  };

  return (
    <>
      <button type="button" className="vjm-md-btn" title="Menu" aria-label="Menu" aria-expanded={open}
        data-active={open || undefined} onClick={() => (open ? requestClose() : setOpen(true))}>
        <BtnIcon open={open} />
      </button>
      {open && (
        /* conteneur transparent plein écran : capte le clic extérieur sans masquer la page */
        <div className="vjm-md-backdrop" onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
          <nav className="vjm-md-panel" data-show={show || undefined} onClick={onLink}>
            {sections.map((it, i) => (
              <a key={it.id} href={it.href} className="vjm-md-item" data-show={show || undefined}
                style={{ transitionDelay: `${i * 0.04}s, ${i * 0.04}s, 0s` }}>
                <Sigle s={it.sigles} flip />
                {it.label}
                <Sigle s={it.sigles} />
              </a>
            ))}
            <div className="vjm-md-rule" />
            <div className="vjm-md-secondary" data-show={show || undefined}>
              {secondary.map((it, i) => (
                <span key={it.href} style={{ display: "contents" }}>
                  {i > 0 && <span className="vjm-md-dot">·</span>}
                  <a href={it.href}>{it.label}</a>
                </span>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
