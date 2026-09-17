/* waniushka-app.jsx — Itération 2 : maquette IA Vania Jaikin Miyazaki */
const { useState, useEffect, useCallback, useMemo, useRef } = React;
const {
  HOME_PHOTOS, KINEMATIK, ALBUMS, CARNETS, CARNETS_ALL, ALEAS, BIO,
  ThemeToggle, PageTransition, Page, MasonryGrid, AudioPlayer, MediaOverlay, Popup,
  IconHome, IconMountain, IconStar, IconMenu, IconButton,
  SOCIAL_ICONS, RichText, SpotifyEmbed,
  useMediaQuery, seededRandom,
} = window;

/* Typo globale — deux familles seulement :
   · Newsreader : titres ET corps (une seule serif, déclinée par graisse/taille)
   · Manrope    : titres de section « digitaux », chiffres, commandes d'interface
   Le manuscrit ne vient plus d'une police mais des scans de Vania (aléas, sigles, signature).
   Doit rester aligné sur le bloc :root du gabarit HTML — ces valeurs l'écrasent au runtime. */
function useGlobalTypo(theme) {
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    const vars = {
      '--font-heading': "'Newsreader', Georgia, serif",
      '--font-body': "'Newsreader', Georgia, serif",
      '--font-digital': "'Manrope', sans-serif",
      '--heading-weight': '400',
    };
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, []);
}

/* Sigles décoratifs autour des titres de section.
   Ce sont les dessins de Vania, découpés depuis les planches SVG par tools/import-vector-sigles.py
   (`src`), sauf le contact où elle a demandé un avion (`glyph`), le second retourné. */
const SIGLES = {
  kinematik: { left: 'assets/brand/sigle-camera-1.svg', right: 'assets/brand/sigle-camera-2.svg' },
  films: { left: 'assets/brand/sigle-spirale-1.svg', right: 'assets/brand/sigle-spirale-2.svg' },
  carnets: { left: 'assets/brand/nav-eye-left.svg', right: 'assets/brand/nav-eye-right.svg' },
  lecture: { left: 'assets/brand/sigle-etoile-1.svg', right: 'assets/brand/sigle-etoile-2.svg' },
  contact: { glyph: '✈', mirror: true },
  biofilmo: { left: 'assets/brand/sigle-camera-1.svg', right: 'assets/brand/sigle-camera-2.svg' },
};

/* Un sigle : dessin scanné ou glyphe. `flip` désigne l'exemplaire de gauche — il retourne
   le dessin (l'avion du contact) ou choisit le fichier prévu pour ce côté (les caméras). */
function Sigle({ id, flip = false, size = '0.8em', opacity = 0.75 }) {
  const s = SIGLES[id];
  if (!s) return null;
  const transform = flip && s.mirror ? 'scaleX(-1)' : 'none';
  const src = flip ? (s.left || s.right) : (s.right || s.left);
  if (src) {
    return (
      <img src={src} alt="" aria-hidden="true" style={{
        height: size, width: 'auto', display: 'block', opacity,
        filter: 'var(--ink-invert)', transform,
      }} />
    );
  }
  return <span aria-hidden="true" style={{ opacity, fontSize: size, display: 'block', transform }}>{s.glyph}</span>;
}

/* Sections du menu — même source pour la page Menu et le déroulant ≡. */
const SECTIONS_MENU = [
  { id: 'kinematik', label: 'Kinematik' },
  { id: 'films', label: 'Films pour les oreilles' },
  { id: 'carnets', label: 'Carnets de voyages' },
  { id: 'lecture', label: 'Coin lecture' },
];
const SECTIONS_VISIBLES = SECTIONS_MENU.filter((s) => !s.hidden);

/* Titre de section cliquable (typo digitale + sigles) — page Menu ET déroulant ≡.
   `size` : 'page' pour la page Menu plein écran, 'menu' dans le déroulant. */
function SectionTitleButton({ id, label, onClick, show = true, delay = 0, size = 'page' }) {
  const big = size === 'page';
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg)',
      fontFamily: 'var(--font-digital)', fontWeight: 400,
      fontSize: big ? 'clamp(1.3rem, 3.2vw, 2rem)' : '1.02rem', letterSpacing: '0.04em',
      display: 'flex', alignItems: 'center', gap: big ? 18 : 12,
      whiteSpace: 'nowrap',
      opacity: show ? 0.8 : 0, transform: show ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s, letter-spacing 0.25s`,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.letterSpacing = '0.09em'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.letterSpacing = '0.04em'; }}
    >
      <Sigle id={id} flip />
      {label}
      <Sigle id={id} />
    </button>
  );
}

/* Retour en arrière — une fine flèche, toujours en haut à gauche de la page.
   Remplace les titres de page que Vania trouvait redondants. */
function BackLink({ label, onClick }) {
  return (
    <button onClick={onClick} title={label || 'Retour'} aria-label={label || 'Retour'} style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)',
      fontFamily: 'var(--font-body)', fontSize: 15, marginBottom: 28,
      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
      transition: 'color 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
    >
      {/* Flèche dessinée plutôt qu'un chevron « ‹ » : à cette graisse, le glyphe de la
          serif se réduit à une virgule qu'on ne voit plus quand il est seul. */}
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor"
        strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M25 7 H2 M8 1.5 L2 7 L8 12.5" />
      </svg>
      {label}
    </button>
  );
}

/* ═══════════════════ EN-TÊTE ═══════════════════ */
/* Composition constante sur toutes les pages :
   nom (gauche) · maison / étoile / thème / montagne (centre) · hamburger (droite) */
function Header({ theme, onToggleTheme, onHome, onMenuToggle, menuOpen, onStar, onMountain, onName }) {
  const [nameHov, setNameHov] = useState(false);
  const isMobile = useMediaQuery('(max-width: 680px)');
  const isCompact = useMediaQuery('(max-width: 480px)');
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--header-h)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingLeft: isMobile ? 10 : 'var(--container-pad)', paddingRight: isMobile ? 10 : 'var(--container-pad)',
    }}>
      {/* Gauche : uniquement le nom manuscrit → bio */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 40 }}>
        <button onClick={onName} title="Bio" aria-label="Vania Jaikin Miyazaki"
          onMouseEnter={() => setNameHov(true)} onMouseLeave={() => setNameHov(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
            lineHeight: 0, opacity: nameHov ? 1 : 0.8, transition: 'opacity 0.25s',
          }}>
          {/* Nom en capitales dessiné par Vania et détouré ; l'encre noire s'inverse en sombre.
              Sa largeur fluide rend le texte lisible sur desktop sans empiéter sur les quatre
              commandes centrales aux largeurs mobiles. */}
          <img src="assets/brand/nom-manuscrit.png" alt="Vania Jaikin Miyazaki"
            style={{
              width: isCompact
                ? 'clamp(72px, 22.5vw, 110px)'
                : isMobile
                  ? 'clamp(100px, 20vw, 136px)'
                  : 'clamp(180px, 20vw, 250px)',
              height: 'auto', display: 'block', filter: 'var(--ink-invert)',
            }} />
        </button>
      </div>

      {/* Centre : maison (menu) · étoile (aléas) · soleil-lune (thème) · montagne (contact) */}
      <div style={{
        position: 'absolute', left: isMobile ? '55%' : '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 4,
      }}>
        <IconButton onClick={onHome} title="Menu"><IconHome /></IconButton>
        <IconButton onClick={onStar} title="Aléas du jour"><IconStar /></IconButton>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <IconButton onClick={onMountain} title="Dessin & contact"><IconMountain /></IconButton>
      </div>

      {/* Droite : menu hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 40, justifyContent: 'flex-end' }}>
        <IconButton onClick={onMenuToggle} title="Menu" active={menuOpen}>
          <IconMenu open={menuOpen} />
        </IconButton>
      </div>
    </header>
  );
}

/* Liens secondaires (contact · bio) — page Menu ET déroulant ≡ */
function SecondaryLinks({ onNavigate, show = true, stopPropagation = false, marginTop = 'var(--block-gap)' }) {
  const items = [
    { id: 'contact', label: 'contact' },
    { id: 'bio', label: 'bio' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18, marginTop,
      opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.2s',
    }}>
      {items.map((it, i) => (
        <React.Fragment key={it.id}>
          {i > 0 && <span style={{ color: 'var(--fg-subtle)', fontSize: 16 }}>·</span>}
          <button onClick={(e) => { if (stopPropagation) e.stopPropagation(); onNavigate(it.id); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)',
            fontFamily: 'var(--font-body)', fontSize: 17, letterSpacing: '0.07em',
            transition: 'color 0.25s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
          >{it.label}</button>
        </React.Fragment>
      ))}
    </div>
  );
}

/* Menu déroulant du ≡ — ancré sous le bouton, en haut à droite.
   Ce n'était pas un menu mais une page à part entière : on quittait la page courante pour
   la retrouver ensuite. Vania veut le menu « juste en-dessous, sans changer de page », donc
   un panneau posé sur la page, qui la laisse visible. */
function MenuDropdown({ onClose, onNavigate }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    /* conteneur transparent plein écran : capte le clic extérieur sans masquer la page */
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', top: 'calc(var(--header-h) - 10px)', right: 'var(--container-pad)',
        background: 'var(--bg)', border: '1px solid var(--border)',
        padding: '22px 26px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}>
        {SECTIONS_VISIBLES.map((it, i) => (
          <SectionTitleButton key={it.id} id={it.id} label={it.label} show={show} delay={i * 0.04}
            size="menu" onClick={() => onNavigate(it.id)} />
        ))}
        <div style={{ width: '100%', height: 1, background: 'var(--border)', marginTop: 4 }} />
        <SecondaryLinks onNavigate={onNavigate} show={show} marginTop={0} />
      </div>
    </div>
  );
}

/* ═══════════════════ ALÉAS DU JOUR ═══════════════════ */
/* Une pop-up posée sur la page courante, qui reste visible dessous : `Popup` fournit la
   carte, la croix en haut à droite, Échap et le clic extérieur. Ni titre ni « cliquer pour
   refermer » — la croix suffit.

   La phrase est l'écriture de Vania elle-même, scannée et détourée (encre sur transparent,
   inversée en thème sombre par `--ink-invert`). On garde le fondu-flou qui accompagnait
   l'ancienne animation mot à mot, désormais sur l'image entière. */
function AleaImage({ src, reducedMotion = false }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), reducedMotion ? 0 : 80);
    return () => clearTimeout(t);
  }, [src, reducedMotion]);
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  return (
    <img src={src} alt="Aléa du jour" style={{
      display: 'block', margin: '0 auto',
      maxWidth: '88vw', maxHeight: '76vh', width: 'auto', height: 'auto',
      filter: show || reducedMotion ? 'var(--ink-invert) blur(0px)' : 'var(--ink-invert) blur(10px)',
      opacity: show ? 1 : 0,
      transform: show || reducedMotion ? 'translateY(0)' : 'translateY(12px)',
      transition: reducedMotion ? 'opacity 0.15s linear' : `opacity 0.9s ${ease}, filter 0.9s ${ease}, transform 0.9s ${ease}`,
    }} />
  );
}

function FullscreenAleaOverlay({ src, onClose }) {
  const [show, setShow] = useState(false);
  const closeRef = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setShow(true));
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      document.querySelector('[aria-label="Aléas du jour"]')?.focus();
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Aléa du jour" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 400, background: 'var(--bg)', color: 'var(--fg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 6vw, 80px)',
      opacity: show ? 1 : 0, transition: reducedMotion ? 'none' : 'opacity 0.35s ease',
    }}>
      <button ref={closeRef} onClick={onClose} aria-label="Fermer" style={{
        position: 'absolute', top: 18, right: 20, width: 44, height: 44,
        background: 'none', border: 'none', color: 'var(--fg)', cursor: 'pointer',
        fontSize: 28, lineHeight: 1, opacity: 0.68,
      }}>×</button>
      <div onClick={(event) => event.stopPropagation()}>
        <AleaImage src={src} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}

/* ═══════════════════ ACCUEIL ═══════════════════ */
function Accueil({ onEnter }) {
  const [show, setShow] = useState(false);
  const photo = useMemo(() => HOME_PHOTOS[Math.floor(Math.random() * HOME_PHOTOS.length)], []);
  useEffect(() => { const t = setTimeout(() => setShow(true), 120); return () => clearTimeout(t); }, []);
  return (
    <div onClick={onEnter} style={{
      height: '100vh', width: '100vw', cursor: 'pointer', position: 'relative',
      backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: show ? 1 : 0, transition: 'opacity 1s ease',
      }}>
        <div style={{ color: '#fff', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))', animation: 'pulse 3s ease-in-out infinite' }}>
          <IconHome size={64} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ MENU ═══════════════════ */
function Menu({ onNavigate }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 30,
      opacity: show ? 1 : 0, transition: 'opacity 0.8s ease',
    }}>
      {SECTIONS_VISIBLES.map((it) => (
        <SectionTitleButton key={it.id} id={it.id} label={it.label} onClick={() => onNavigate(it.id)} />
      ))}
      <SecondaryLinks onNavigate={onNavigate} />
    </div>
  );
}

/* Titre de page (digital + sigles) — ne subsiste que sur le Contact ; ailleurs, Vania
   trouvait le titre redondant avec le menu et préfère une flèche de retour. */
function PageTitle({ id, label, align = 'center' }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-digital)', fontWeight: 400, fontSize: 'clamp(1.4rem, 3vw, 2rem)',
      letterSpacing: '0.05em', marginBottom: 'var(--block-gap)',
      display: 'flex', alignItems: 'center', gap: 16,
      justifyContent: align === 'center' ? 'center' : 'flex-start',
    }}>
      <Sigle id={id} flip size="0.85em" opacity={0.45} />
      {label}
      <Sigle id={id} size="0.85em" opacity={0.45} />
    </h1>
  );
}

/* ═══════════════════ KINEMATIK ═══════════════════ */
/* Vania voulait la page « plus bordélique, comme les carnets de voyages » : douze rectangles
   identiques, ça n'était pas ça. On reprend donc la mécanique du collage — colonnes CSS qui
   empilent sans laisser de trous, rotation, décalage, liseré occasionnel — et on y ajoute ce
   que le collage n'a pas : des formats différents. Les miniatures Vimeo sont toutes en 16/9,
   les carrés et les verticaux sont des recadrages en `objectFit: cover`.

   Le flex-wrap d'avant ne pouvait pas suivre : avec des hauteurs inégales et un alignement
   en haut, chaque vignette verticale creusait un trou de sa hauteur dans la rangée.

   Tout est tiré de `seededRandom(i)` : l'agencement est le même à chaque visite. */
const KIN_RATIOS = ['16 / 9', '1 / 1', '4 / 3', '3 / 4', '16 / 9', '5 / 4', '4 / 3', '4 / 5'];

function KinematikPage({ onOpenMedia, onBack }) {
  const isMob = useMediaQuery('(max-width: 760px)');
  return (
    <Page>
      <BackLink onClick={onBack} />
      <div style={{ columnCount: isMob ? 2 : 3, columnGap: isMob ? 16 : 40 }}>
        {KINEMATIK.map((v, i) => (
          <KinTile key={v.id} v={v} index={i} isMob={isMob}
            onClick={() => onOpenMedia(KINEMATIK, i)} />
        ))}
      </div>
    </Page>
  );
}

function KinTile({ v, index, isMob, onClick }) {
  const [hov, setHov] = useState(false);
  /* Mobile : deux colonnes bien rangées, tout en 16/9. Le désordre sur un écran de téléphone
     tourne au chaos illisible. */
  const tf = useMemo(() => {
    if (isMob) return { w: '100%', shift: 0, base: 'none', border: false, pad: 0, ratio: '16 / 9' };
    /* la vignette n'occupe pas toute sa colonne et n'y est pas centrée : c'est ce décalage,
       plus que la rotation, qui casse l'alignement vertical */
    const w = 80 + seededRandom(index + 300) * 20;
    return {
      w: `${w.toFixed(1)}%`,
      shift: (100 - w) * seededRandom(index + 250),
      base: `rotate(${((seededRandom(index) - 0.5) * 5).toFixed(2)}deg) `
        + `translate(${((seededRandom(index + 50) - 0.5) * 14).toFixed(1)}px, `
        + `${((seededRandom(index + 100) - 0.5) * 10).toFixed(1)}px)`,
      border: seededRandom(index + 150) > 0.65,
      pad: seededRandom(index + 200) > 0.7 ? 6 : 0,
      ratio: KIN_RATIOS[index % KIN_RATIOS.length],
    };
  }, [index, isMob]);

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        breakInside: 'avoid', width: tf.w, marginLeft: `${tf.shift}%`,
        marginBottom: isMob ? 16 : 48,
        cursor: 'pointer', position: 'relative',
        padding: tf.pad, border: tf.border ? '1px solid var(--fg-subtle)' : 'none',
        /* le survol s'ajoute à la rotation de base, sinon la vignette se redresse d'un coup */
        transform: hov ? `${tf.base} scale(1.03)` : tf.base,
        transition: 'transform 0.3s ease',
      }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: tf.ratio, background: 'var(--fg-subtle)', overflow: 'hidden' }}>
        <img src={`assets/kinematik/${v.id}.jpg`} alt={v.titre} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {/* Voile franc dans la couleur du site : atténuer l'image ne suffisait pas, la durée
            et l'année devenaient illisibles selon la photo. Ici c'est vraiment noir sur blanc
            (et blanc sur noir en thème sombre). */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 14,
          background: 'var(--bg)', color: 'var(--fg)',
          opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
          fontFamily: 'var(--font-body)',
        }}>
          <span style={{ fontSize: 'clamp(15px, 1.5vw, 19px)', fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}>{v.titre}</span>
          {v.sousTitre && (
            <span style={{ fontSize: 'clamp(14px, 1.4vw, 18px)', fontFamily: 'var(--font-heading)', lineHeight: 1.3, opacity: 0.75 }}>{v.sousTitre}</span>
          )}
          {/* « Trailer » explique une durée de deux minutes pour un film qui en fait quatre-vingt-dix */}
          <span style={{ fontFamily: 'var(--font-digital)', fontSize: 12, color: 'var(--fg-muted)', marginTop: 10 }}>
            {v.trailer && 'Trailer · '}{v.duree} · {v.annee}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ FILMS (liste albums) ═══════════════════ */
function AlbumInfoIcon({ albumId, size = 24 }) {
  const index = Math.max(0, ALBUMS.findIndex((album) => album.id === albumId));
  return <img src={`assets/brand/info-album-${Math.min(index + 1, 3)}.svg`} alt="" aria-hidden="true" style={{
    width: size, height: size, objectFit: 'contain', display: 'block', filter: 'var(--ink-invert)',
  }} />;
}

function FilmsPage({ onOpenAlbum, onInfo, onBack }) {
  return (
    <Page>
      <BackLink onClick={onBack} />
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {ALBUMS.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            padding: 'clamp(30px, 4vw, 52px) 0', borderBottom: '1px solid var(--border)',
          }}>
            <button onClick={() => onOpenAlbum(a.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg)',
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem, 1.8vw, 1.45rem)',
              textAlign: 'left', transition: 'opacity 0.2s', opacity: 0.9, lineHeight: 1.25,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.9; }}
            >{a.titre}</button>
            <button onClick={() => onInfo(a.id)} aria-label={`Infos — ${a.titre}`} title="Infos" style={{
              background: 'none', border: 'none', color: 'var(--fg-muted)',
              width: 44, height: 44, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.2s', opacity: 0.62,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.62; }}
            ><AlbumInfoIcon albumId={a.id} size={28} /></button>
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ═══════════════════ ALBUM (player) ═══════════════════ */
function AlbumPage({ album, onBack, onInfo }) {
  return (
    <Page>
      <BackLink label="Films pour les oreilles" onClick={onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--block-gap)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 2.2vw, 1.7rem)', lineHeight: 1.2 }}>{album.titre}</h1>
        <button onClick={() => onInfo(album.id)} aria-label={`Infos — ${album.titre}`} title="Infos" style={{
          background: 'none', border: 'none', color: 'var(--fg-muted)',
          width: 40, height: 40, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.68,
        }}><AlbumInfoIcon albumId={album.id} size={25} /></button>
      </div>
      {/* Les albums masterisés ont leur player maison ; « L'apparition des coquillages »
          n'existe que sur Spotify et s'y écoute directement. */}
      {album.episodes
        ? <AudioPlayer tracks={album.episodes} />
        : <SpotifyEmbed src={album.spotify} title={album.titre} />}
    </Page>
  );
}

/* ═══════════════════ CARNETS ═══════════════════ */
/* Carnets + photos d'accueil : ces dernières y sont enfin vues entières, alors que
   l'accueil les rogne en plein écran. */
function CarnetsPage({ onOpenMedia, onBack }) {
  return (
    <Page>
      <BackLink onClick={onBack} />
      <MasonryGrid items={CARNETS_ALL} variant="collage" onItemClick={(item) => {
        const idx = CARNETS_ALL.findIndex((c) => c.id === item.id);
        onOpenMedia(CARNETS_ALL, idx);
      }} />
    </Page>
  );
}

/* ═══════════════════ CONTACT (form + canvas + IBAN) ═══════════════════ */

/* Encres de la zone dessin. 'ink' = couleur du thème, résolue au moment du tracé. */
const INKS = [
  { id: 'ink',    css: 'var(--fg)', label: 'encre' },
  { id: 'orange', css: '#FF6B00',   label: 'orange' },
  { id: 'rose',   css: '#FF2D95',   label: 'rose' },
  { id: 'vert',   css: '#39FF14',   label: 'vert' },
  { id: 'jaune',  css: '#FFE800',   label: 'jaune' },
  { id: 'bleu',   css: '#00CFFF',   label: 'bleu' },
];
const LINE_WIDTH = 2.5;

/* Zone de dessin. Les traits sont conservés en mémoire ({color, pts}) et rejoués :
   le dessin survit au resize (sans flou) et à la bascule de thème (l'encre suit --fg). */
const DrawCanvas = React.forwardRef(function DrawCanvas({ theme }, apiRef) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const strokes = useRef([]);
  const [ink, setInk] = useState('ink');

  /* id d'encre → couleur CSS réelle. 'ink' est résolu ici, donc suit le thème courant. */
  const resolve = (id) => {
    if (id === 'ink') {
      return getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#000';
    }
    const found = INKS.find((c) => c.id === id);
    return found ? found.css : id;
  };

  const redraw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = LINE_WIDTH; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.current.forEach((s) => {
      if (s.pts.length < 2) return;
      ctx.strokeStyle = resolve(s.color);
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      s.pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, []);

  /* Redessine au montage, à chaque resize et à chaque bascule de thème.
     rAF : les effets enfants passent avant ceux du parent, donc `data-theme`
     n'est pas encore posé sur <html> — on attend la frame suivante pour lire --fg. */
  useEffect(() => {
    const raf = requestAnimationFrame(redraw);
    window.addEventListener('resize', redraw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', redraw); };
  }, [redraw, theme]);

  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (e) => {
    drawing.current = true;
    const { x, y } = pos(e);
    strokes.current.push({ color: ink, pts: [{ x, y }] });
    const ctx = ref.current.getContext('2d');
    ctx.strokeStyle = resolve(ink);
    ctx.lineWidth = LINE_WIDTH; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    strokes.current[strokes.current.length - 1].pts.push({ x, y });
    const ctx = ref.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clear = () => { strokes.current = []; redraw(); };

  React.useImperativeHandle(apiRef, () => ({
    toBlob: () => new Promise((resolveBlob) => {
      if (!strokes.current.length || !ref.current) return resolveBlob(null);
      const source = ref.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = source.getBoundingClientRect();
      // Netlify limite toute la requête à 8 Mo. Les écrans 4K/Retina peuvent sinon produire
      // un PNG de plus de 15 Mo ; deux millions de pixels gardent le trait net et une marge
      // sûre pour les champs texte du multipart.
      const MAX_EXPORT_PIXELS = 2_000_000;
      const exportScale = Math.min(dpr, Math.sqrt(MAX_EXPORT_PIXELS / (rect.width * rect.height)));
      const output = document.createElement('canvas');
      output.width = Math.max(1, Math.round(rect.width * exportScale));
      output.height = Math.max(1, Math.round(rect.height * exportScale));
      const ctx = output.getContext('2d');
      ctx.fillStyle = '#FAFAF8';
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.setTransform(exportScale, 0, 0, exportScale, 0, 0);
      ctx.lineWidth = LINE_WIDTH; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.current.forEach((stroke) => {
        if (stroke.pts.length < 2) return;
        const color = INKS.find((candidate) => candidate.id === stroke.color);
        ctx.strokeStyle = stroke.color === 'ink' ? '#1A1A1A' : (color?.css || stroke.color);
        ctx.beginPath();
        ctx.moveTo(stroke.pts[0].x, stroke.pts[0].y);
        stroke.pts.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      });
      output.toBlob(resolveBlob, 'image/png');
    }),
    clear,
  }), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={ref}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none', display: 'block' }} />

      {/* Barre flottante : palette + effacer.
          En bas, elle sortait du cadre selon la hauteur de fenêtre — Vania ne voyait plus
          les couleurs. En haut, elle est toujours au-dessus de la ligne de flottaison. */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '18px clamp(16px, 3vw, 32px)', pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          {INKS.map((c) => (
            <button key={c.id} onClick={() => setInk(c.id)} title={c.label} aria-label={c.label}
              style={{
                width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: c.css,
                border: c.id === 'ink' ? '1px solid var(--fg-subtle)' : 'none',
                outline: ink === c.id ? '1px solid var(--fg)' : 'none',
                outlineOffset: 3, transition: 'transform 0.2s',
                transform: ink === c.id ? 'scale(1.12)' : 'scale(1)',
              }} />
          ))}
        </div>
        <button onClick={clear} style={{
          pointerEvents: 'auto', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--fg-muted)', fontSize: 12, fontFamily: 'var(--font-body)',
          letterSpacing: '0.08em', transition: 'color 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
        >effacer</button>
      </div>
    </div>
  );
});

/* Réserve éditoriale : aucun modèle de texte n'est imposé avant la réflexion sur la
   présentation et la structure. Le titre confirme seulement la destination au visiteur. */
function ReadingPage({ onBack }) {
  return (
    <Page>
      <BackLink label="Retour au menu" onClick={onBack} />
      <h1 style={{
        fontFamily: 'var(--font-digital)', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 400, letterSpacing: '0.04em', margin: 0,
      }}>Coin lecture</h1>
    </Page>
  );
}

function ContactPage({ theme }) {
  const isMob = useMediaQuery('(max-width: 760px)');
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const field = { width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-body)', fontSize: 15, marginTop: 6 };

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const drawing = await canvasRef.current?.toBlob();
      if (drawing) formData.append('dessin', drawing, `dessin-${Date.now()}.png`);
      const response = await fetch('/', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Netlify Forms: ${response.status}`);
      form.reset();
      canvasRef.current?.clear();
      setStatus('success');
    } catch (error) {
      console.error('Échec de l’envoi du formulaire', error);
      setStatus('error');
    }
  };

  const canvasH = isMob ? '60vh' : 'calc(100vh - var(--header-h))';
  return (
    <Page variant="bleed">
      <div style={{
        display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr',
        minHeight: isMob ? 0 : 'calc(100vh - var(--header-h))',
      }}>
        <div style={{
          order: isMob ? 2 : 1,
          height: canvasH,
          borderRight: isMob ? 'none' : '1px solid var(--border)',
          borderTop: isMob ? '1px solid var(--border)' : 'none',
        }}>
          <DrawCanvas ref={canvasRef} theme={theme} />
        </div>

        <div style={{
          order: isMob ? 1 : 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          paddingLeft: 'var(--container-pad)', paddingRight: 'var(--container-pad)',
          paddingTop: isMob ? 'clamp(40px, 8vh, 72px)' : 'clamp(32px, 6vh, 64px)',
          paddingBottom: 'clamp(40px, 8vh, 72px)',
        }}>
          <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>
            <PageTitle id="contact" label="Contact" align="left" />
            <form name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field"
              onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <input type="hidden" name="form-name" value="contact" />
              <input type="hidden" name="subject" value="Nouveau message depuis vjmvjmvjm.com" />
              <p hidden><label>Ne pas remplir : <input name="bot-field" /></label></p>
              <label style={{ fontSize: 14, color: 'var(--fg-muted)' }}>nom<input name="nom" required autoComplete="name" style={field} /></label>
              <label style={{ fontSize: 14, color: 'var(--fg-muted)' }}>email<input name="email" type="email" required autoComplete="email" style={field} /></label>
              <label style={{ fontSize: 14, color: 'var(--fg-muted)' }}>message<textarea name="message" rows="5" required style={{ ...field, resize: 'vertical' }} /></label>
              <button type="submit" disabled={status === 'sending'} style={{
                alignSelf: 'flex-start', background: 'var(--fg)', color: 'var(--bg)', border: 'none',
                minHeight: 44, padding: '10px 26px', cursor: status === 'sending' ? 'wait' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 14, letterSpacing: '0.04em',
                opacity: status === 'sending' ? 0.6 : 1,
              }}>{status === 'sending' ? 'Envoi…' : 'Envoyer'}</button>
              <p aria-live="polite" style={{ minHeight: 24, fontSize: 14, color: status === 'error' ? '#b42318' : 'var(--fg-muted)' }}>
                {status === 'success' && 'Merci, votre message et votre dessin ont bien été envoyés.'}
                {status === 'error' && 'L’envoi a échoué. Votre dessin est conservé : vous pouvez réessayer.'}
              </p>
            </form>
            <SocialLinks />
            <div style={{ marginTop: 16, fontSize: 15, color: 'var(--fg-muted)', lineHeight: 1.7 }}>
              <a href={`mailto:${BIO.email}`} style={{ textUnderlineOffset: '0.18em' }}>{BIO.email}</a>
              <p style={{ marginTop: 8 }}>Pour faire des cadeaux, voici mon IBAN.<br /><span style={{ color: 'var(--fg)' }}>{BIO.iban}</span></p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* Réseaux de Vania, juste au-dessus de l'adresse mail */
function SocialLinks() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 'var(--block-gap)' }}>
      {BIO.social.map((s) => {
        const Icon = SOCIAL_ICONS[s.id];
        return Icon ? (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
            title={s.label} aria-label={s.label}
            style={{ color: 'var(--fg)', opacity: 0.5, lineHeight: 0, transition: 'opacity 0.25s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; }}
          ><Icon /></a>
        ) : null;
      })}
    </div>
  );
}

/* ═══════════════════ BIO ═══════════════════ */
const sectionLabel = {
  margin: '36px 0 14px', fontFamily: 'var(--font-digital)', fontSize: 11,
  letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-muted)',
};

/* La bio se lit en deux temps. La page ne porte plus que le texte de présentation — celui
   que Vania avait écrit en manuscrite dans son PDF, désormais en Newsreader comme le reste :
   à la lecture-test, tout ce qui était « écrit à la main ou dans une police un peu spéciale »
   décourageait de lire. Le CV réel (biofilmographie + art contemporain) part en pop-up,
   derrière un lien : il est là pour qui le cherche, il n'écrase plus la présentation. */
function BioPage() {
  const isMob = useMediaQuery('(max-width: 760px)');
  const [filmoOpen, setFilmoOpen] = useState(false);
  const portrait = useMemo(() => BIO.portraits[Math.floor(Math.random() * BIO.portraits.length)], []);
  const portraitImg = (
    <img src={portrait} alt="Vania Jaikin Miyazaki" loading="lazy" style={{
      width: '100%', aspectRatio: isMob ? '4 / 5' : '3 / 4', objectFit: 'cover', objectPosition: 'center',
      display: 'block',
    }} />
  );
  return (
    <Page>
      <div style={{
        display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 0.8fr',
        gap: 'var(--block-gap)', alignItems: 'start',
      }}>
        {isMob && portraitImg}
        <div style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7, maxWidth: 720 }}>
          {/* un cran au-dessus du corps courant : c'est le seul texte de la page */}
          <div style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.35rem)' }}>
            {BIO.intro.map((p, i) => (
              <p key={i} style={{ marginBottom: 18, opacity: 0.92 }}>{p}</p>
            ))}
          </div>
          <div style={{ marginTop: 'var(--block-gap)' }}>
            <SectionTitleButton id="biofilmo" label="Biofilmographie" size="menu"
              onClick={() => setFilmoOpen(true)} />
          </div>
          <p style={{ marginTop: 30, fontSize: 15, color: 'var(--fg-muted)' }}>
            {BIO.email}
          </p>
        </div>
        {!isMob && (
          <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 32px)' }}>{portraitImg}</div>
        )}
      </div>

      {filmoOpen && (
        <Popup onClose={() => setFilmoOpen(false)} maxWidth={720} padding="52px 44px 40px">
          {/* `Popup` ne défile pas — le CV complet déborde de l'écran, on lui donne sa
              propre zone de défilement plutôt que de changer une carte partagée avec les
              aléas et les infos d'album. */}
          <div style={{
            maxHeight: '70vh', overflowY: 'auto',
            fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.4vw, 1.1rem)', lineHeight: 1.7,
          }}>
            {BIO.filmo.map((parts, i) => (
              <p key={i} style={{ marginBottom: 16, opacity: 0.92 }}><RichText parts={parts} /></p>
            ))}
            <p style={sectionLabel}>Art contemporain</p>
            {BIO.art.map((parts, i) => (
              <p key={i} style={{ marginBottom: 8, opacity: 0.92 }}><RichText parts={parts} /></p>
            ))}
          </div>
        </Popup>
      )}
    </Page>
  );
}

/* ═══════════════════ APP ═══════════════════ */
function App() {
  const [theme, setTheme] = useState('light');
  const [page, setPage] = useState('accueil');
  const [menuOpen, setMenuOpen] = useState(false);
  const [aleas, setAleas] = useState(null);       // phrase courante ou null
  const [infoAlbum, setInfoAlbum] = useState(null); // album id ou null
  const [albumId, setAlbumId] = useState(null);
  const [media, setMedia] = useState(null);        // { items, index } ou null

  useGlobalTypo(theme);

  const toggleTheme = useCallback(() => setTheme((v) => (v === 'light' ? 'dark' : 'light')), []);
  const go = useCallback((p) => { setPage(p); setMenuOpen(false); }, []);
  const openStar = useCallback(() => setAleas(ALEAS[Math.floor(Math.random() * ALEAS.length)]), []);
  const openMedia = useCallback((items, index) => setMedia({ items, index }), []);
  const mediaPrev = useCallback(() => setMedia((m) => ({ ...m, index: (m.index - 1 + m.items.length) % m.items.length })), []);
  const mediaNext = useCallback(() => setMedia((m) => ({ ...m, index: (m.index + 1) % m.items.length })), []);

  const activeAlbum = useMemo(() => ALBUMS.find((a) => a.id === albumId), [albumId]);
  const infoAlbumObj = useMemo(() => ALBUMS.find((a) => a.id === infoAlbum), [infoAlbum]);

  const showHeader = page !== 'accueil';

  const renderPage = () => {
    switch (page) {
      case 'accueil': return <Accueil onEnter={() => go('menu')} />;
      case 'menu':    return <Menu onNavigate={go} />;
      case 'kinematik': return <KinematikPage onOpenMedia={openMedia} onBack={() => go('menu')} />;
      case 'films':   return <FilmsPage onOpenAlbum={(id) => { setAlbumId(id); setPage('album'); }} onInfo={setInfoAlbum} onBack={() => go('menu')} />;
      case 'album':   return <AlbumPage album={activeAlbum} onBack={() => go('films')} onInfo={setInfoAlbum} />;
      case 'carnets': return <CarnetsPage onOpenMedia={openMedia} onBack={() => go('menu')} />;
      case 'lecture': return <ReadingPage onBack={() => go('menu')} />;
      case 'contact': return <ContactPage theme={theme} />;
      case 'bio':     return <BioPage />;
      default:        return <Accueil onEnter={() => go('menu')} />;
    }
  };

  return (
    <div>
      {showHeader && (
        <Header
          theme={theme} onToggleTheme={toggleTheme}
          onHome={() => go('menu')} onMenuToggle={() => setMenuOpen((v) => !v)} menuOpen={menuOpen}
          onStar={openStar} onMountain={() => go('contact')} onName={() => go('bio')}
        />
      )}

      <PageTransition pageKey={page + '|' + (albumId || '')}>
        {renderPage()}
      </PageTransition>

      {menuOpen && <MenuDropdown onClose={() => setMenuOpen(false)} onNavigate={go} />}

      {aleas && (
        <FullscreenAleaOverlay src={aleas} onClose={() => setAleas(null)} />
      )}

      {infoAlbumObj && (
        <Popup onClose={() => setInfoAlbum(null)}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 2.6vw, 1.6rem)', marginBottom: 18 }}>{infoAlbumObj.titre}</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.65, opacity: 0.9 }}>
            <RichText parts={infoAlbumObj.infos} />
          </p>
        </Popup>
      )}

      {media && (
        <MediaOverlay items={media.items} index={media.index}
          onClose={() => setMedia(null)} onPrev={mediaPrev} onNext={mediaNext} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
