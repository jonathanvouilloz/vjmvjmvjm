/* waniushka-components.jsx — Shared components & data */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ── Pseudo-random from seed ── */
function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── Responsive hook ── */
function useMediaQuery(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const h = (e) => setM(e.matches);
    mql.addEventListener('change', h);
    return () => mql.removeEventListener('change', h);
  }, [query]);
  return m;
}

/* ═══ Itération 2 — data maquette (contenu partiel, en dur) ═══ */

/* Inventaire des images, généré par tools/import-images.py dans waniushka-assets.jsx.
   Chaque entrée : { id, src, w, h, thumb?, title? }. Relancer le script après tout ajout
   de Vania dans JONATHAN/ — rien n'est listé à la main ici. */
const { CARNETS_SRC, HOME_SRC, PORTRAITS_SRC, ALEAS_SRC } = window;

/* Accueil : photos aléatoires plein écran.
   ⚠ PAYSAGE uniquement — l'affichage est en background cover 100vw/100vh, une photo
   portrait s'y retrouve rognée sur toute sa hauteur. Le filtre se fait sur les dimensions
   réelles relevées à l'import, plus sur une liste tenue à la main. */
const HOME_PHOTOS = HOME_SRC.filter((p) => p.w / p.h > 1.15).map((p) => p.src);

/* Contenu éditable : `content/*.json`, lu au build par tools/build-content.mjs et posé sur
   `window.CONTENT`. Toute propriété `md` y a déjà sa sœur `html`. */
const CONTENT = window.CONTENT;

/* Kinematik : `titre` + `sousTitre` sur deux lignes (un tiret tombait n'importe où sur une
   vignette étroite). `trailer` explique une durée de deux minutes pour un film de quatre-vingt-dix.
   `mention` : information exceptionnelle affichée en permanence sur la vignette.
   `resume` (blocs) et `generique` : derrière le « i » de la lightbox.
   Les vignettes sont dans `assets/kinematik/{id}.jpg` (tools/fetch-thumbs.py). */
const KINEMATIK = CONTENT.kinematik;

/* Films pour les oreilles. `infos` = blocs (texte, images, vidéos) de la pop-up du « i ».
   Un album sans épisodes mais avec un `spotify` s'affiche en lecteur Spotify intégré. */
const ALBUMS = CONTENT.albums.map((a) => ({ ...a, episodes: a.episodes?.length ? a.episodes : null }));

/* Carnets de voyage : les 53 pages scannées, titrées par leur nom de fichier. */
const CARNETS = CARNETS_SRC;

/* Les photos de l'accueil s'affichent en `background: cover` plein écran, donc rognées —
   et les portraits n'y passent pas du tout. Le collage des carnets les reprend TOUTES,
   entières. Elles n'ont pas de titre : les légendes sont conditionnelles côté rendu. */
const PHOTOS = HOME_SRC;

/* Entrelacement déterministe carnets × photos : concaténées, elles formeraient deux blocs
   nets au lieu d'un collage. Tri par clé pseudo-aléatoire stable (même ordre à chaque visite). */
const CARNETS_ALL = [...CARNETS, ...PHOTOS]
  .map((item, i) => ({ item, k: seededRandom(i * 7 + 3) }))
  .sort((a, b) => a.k - b.k)
  .map((e) => e.item);

/* Aléas du jour : les 24 phrases manuscrites de Vania, détourées en PNG transparents par
   tools/cutout-drawing.py. Ce sont des images et non du texte — c'est sa main, pas une
   police qui l'imite (les deux manuscrites du site étaient sous licence non commerciale). */
const ALEAS = ALEAS_SRC;

/* Bio : `pro` sur la page (FR/EN), `perso` derrière l'œil. Réglages de contact dans site.json. */
const BIO = {
  ...CONTENT.site,
  textes: CONTENT.bio,
  /* Série d'autoportraits fournie par Vania : la page bio en tire un au hasard à chaque
     visite, comme l'accueil tire sa photo. */
  portraits: PORTRAITS_SRC.map((p) => p.src),
};

/* Coin lecture : un fichier par texte dans content/lecture/, déjà triés. */
const LECTURE = CONTENT.lecture;

/* News : une annonce n'apparaît que si elle est active ET dans sa fenêtre de dates —
   l'encart disparaît tout seul le lendemain de `fin`. */
function activeNews(today = new Date()) {
  const d = today.toISOString().slice(0, 10);
  return CONTENT.news.find((n) => n.actif && (!n.debut || n.debut <= d) && (!n.fin || d <= n.fin)) || null;
}

/* ── ScrollReveal ── */
function ScrollReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.unobserve(el); }
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} style={{
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(14px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      {children}
    </div>
  );
}

/* ── ThemeToggle (Sun / Moon) ── */
function ThemeToggle({ theme, onToggle }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onToggle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      aria-label={theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 8,
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg)', opacity: hov ? 1 : 0.85, transition: 'opacity 0.3s',
      }}>
      <BrandIcon src={theme === 'light' ? 'assets/brand/nav-moon.svg' : 'assets/brand/nav-sun.svg'} size={27} />
    </button>
  );
}

/* ── PageTransition ── */
function PageTransition({ children, pageKey }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    setVis(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVis(true)));
    return () => cancelAnimationFrame(raf);
  }, [pageKey]);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
      minHeight: 'calc(100vh - 80px)',
    }}>
      {children}
    </div>
  );
}

/* ── Page : container de base commun à toutes les pages ──
   'default' → container large + padding latéral + rythme vertical
   'prose'   → idem + colonne de lecture centrée
   'bleed'   → pleine largeur, sans padding (split plein écran) */
function Page({ children, variant = 'default', style = {} }) {
  if (variant === 'bleed') {
    return <div style={{ paddingTop: 'var(--header-h)', ...style }}>{children}</div>;
  }
  const outer = {
    maxWidth: 'var(--container-max)', margin: '0 auto',
    paddingLeft: 'var(--container-pad)', paddingRight: 'var(--container-pad)',
    paddingTop: 'var(--page-top)', paddingBottom: 'var(--page-bottom)',
    ...style,
  };
  if (variant === 'prose') {
    return (
      <div style={outer}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>{children}</div>
      </div>
    );
  }
  return <div style={outer}>{children}</div>;
}

/* ── MasonryGrid ── */
function MasonryGrid({ items, variant = 'organique', onItemClick }) {
  const isCollage = variant === 'collage';
  const isMobile = useMediaQuery('(max-width: 680px)');
  const cols = isMobile ? 2 : 4;

  const transforms = useMemo(() =>
    items.map((_, i) => ({
      rot: isCollage ? (seededRandom(i) - 0.5) * 5 : 0,
      tx: isCollage ? (seededRandom(i + 50) - 0.5) * 14 : 0,
      ty: isCollage ? (seededRandom(i + 100) - 0.5) * 10 : 0,
      hasBorder: isCollage && seededRandom(i + 150) > 0.65,
      pad: isCollage && seededRandom(i + 200) > 0.7 ? 6 : 0,
    })),
    [items.length, isCollage]
  );

  return (
    <div style={{ columnCount: cols, columnGap: isCollage ? 32 : 24 }}>
      {items.map((item, i) => {
        const tf = transforms[i];
        const base = `rotate(${tf.rot}deg) translate(${tf.tx}px, ${tf.ty}px)`;
        return (
          /* Décalage en rouleau plutôt qu'indexé sur la position absolue : le collage compte
             117 images, `i * 50` faisait attendre près de six secondes à la dernière — et
             l'attente s'appliquait même une fois l'image amenée à l'écran par le scroll. */
          <ScrollReveal key={item.id} delay={(i % 8) * 50}>
            <div
              onClick={() => onItemClick && onItemClick(item)}
              style={{
                /* marge basse généreuse en collage : la rotation + le décalage font
                   remonter l'image suivante sur la légende de la précédente */
                breakInside: 'avoid', marginBottom: isCollage ? 40 : 24,
                transform: base, cursor: 'pointer',
                padding: tf.pad, border: tf.hasBorder ? '1px solid var(--fg-subtle)' : 'none',
                transition: 'transform 0.4s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = base + ' scale(1.025)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = base; }}
            >
              {item.src ? (
                /* la vignette allégée, jamais la pleine résolution : le collage aligne
                   117 images sur une page, la version pleine est pour la lightbox */
                <img src={item.thumb || item.src} alt={item.title} loading="lazy"
                  width={item.w} height={item.h}
                  style={{ width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <div style={{ background: item.bg, height: item.height, width: '100%' }}></div>
              )}
              {/* les photos d'accueil n'ont pas de titre : pas de légende vide */}
              {item.title && <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 12,
                color: 'var(--fg-muted)', letterSpacing: '0.02em',
              }}>{item.title}</p>}
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}

/* ── AudioPlayer ──
   Un vrai <audio> hors du DOM rendu : l'élément porte la lecture, React ne fait que refléter
   son état (`timeupdate` → position, `ended` → piste suivante). `preload="none"` est
   indispensable, les épisodes pèsent jusqu'à 40 Mo et il ne faut en charger qu'un, à la
   demande. Les durées affichées viennent des data (ffprobe), pas de l'élément : elles sont
   correctes avant même que le fichier commence à se télécharger. */
function AudioPlayer({ tracks }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef(null);

  const track = tracks[cur];
  const progress = track.sec ? Math.min(100, (elapsed / track.sec) * 100) : 0;

  useEffect(() => {
    const el = new Audio();
    el.preload = 'none';
    audioRef.current = el;
    const onTime = () => setElapsed(el.currentTime);
    const onEnd = () => setCur((i) => (i + 1 < tracks.length ? i + 1 : i));
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.pause();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [tracks]);

  /* Changement de piste (clic dans la liste, enchaînement en fin d'épisode) ou d'album :
     on recharge la source et on relance si on était déjà en lecture. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = track.src;
    setElapsed(0);
    if (playing) el.play().catch(() => setPlaying(false));
  }, [cur, tracks]);

  const play = () => {
    const el = audioRef.current;
    if (!el.src) el.src = track.src;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const toggle = () => {
    if (!playing) return play();
    audioRef.current.pause();
    setPlaying(false);
  };
  /* Rejouer la piste déjà courante ne déclenche pas l'effet ci-dessus (`cur` ne change pas) :
     on lance la lecture à la main. */
  const select = (i) => {
    if (i === cur) return play();
    setCur(i);
    setPlaying(true);
  };

  const seek = (sec) => {
    const el = audioRef.current;
    const next = Math.max(0, Math.min(track.sec, sec));
    el.currentTime = next;
    setElapsed(next);
  };
  const skip = (deltaSec) => seek(elapsed + deltaSec);

  const mm = Math.floor(elapsed / 60);
  const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');

  /* Commandes et minutages en typo digitale : à ces tailles-là, la serif du corps
     devient illisible. Le texte éditorial (titres d'épisodes) reste en serif.
     Les sauts sont de simples chevrons — les libellés « 30s » / « 1min » alourdissaient
     la ligne ; l'information reste dans l'infobulle. */
  const skipBtn = (glyph, title, delta) => (
    <button onClick={() => skip(delta)} title={title} aria-label={title} style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)',
      fontFamily: 'var(--font-digital)', fontSize: 17, lineHeight: 1,
      padding: '2px 5px', flexShrink: 0, transition: 'color 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
    >{glyph}</button>
  );
  const time = {
    fontFamily: 'var(--font-digital)', fontSize: 13, color: 'var(--fg-muted)',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div>
      {/* Now playing */}
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontFamily: 'var(--font-digital)', fontSize: 12, color: 'var(--fg-muted)',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24,
        }}>
          À l'écoute
        </p>
        {/* Le play ouvre la ligne, seul. Les sauts sont descendus sous la barre. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggle} aria-label={playing ? 'Pause' : 'Lecture'}
            style={{
              background: 'none', border: '1px solid var(--fg)', borderRadius: '50%',
              width: 48, height: 48, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--fg)',
              transition: 'background 0.25s, color 0.25s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fg)'; e.currentTarget.style.color = 'var(--bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--fg)'; }}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"></polygon></svg>
            )}
          </button>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(19px, 1.8vw, 24px)', marginBottom: 14, fontWeight: 'var(--heading-weight, 400)' }}>{track.title}</p>
            <div style={{ position: 'relative', height: 2, background: 'var(--border)', borderRadius: 1, cursor: 'pointer' }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * track.sec); }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--fg)', borderRadius: 1, width: `${progress}%`, transition: 'width 0.08s linear' }}></div>
            </div>
            {/* écoulé, puis les sauts juste après, la durée poussée à droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <span style={time}>{mm}:{ss}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {skipBtn('«', 'Reculer d\'une minute', -60)}
                {skipBtn('‹', 'Reculer de 30 secondes', -30)}
                {skipBtn('›', 'Avancer de 30 secondes', 30)}
                {skipBtn('»', 'Avancer d\'une minute', 60)}
              </div>
              <span style={{ ...time, marginLeft: 'auto' }}>{track.duration}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Liste des épisodes — sans filets : le petit ▸ suffit à dire que la ligne se joue */}
      <div>
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} current={i === cur} playing={playing}
            onSelect={() => select(i)} />
        ))}
      </div>
    </div>
  );
}

function TrackPlayIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M4.2 2.5L11 7 4.2 11.5Z" fill="currentColor" opacity={active ? 1 : 0.72} />
    </svg>
  );
}

function TrackRow({ track, index, current, playing, onSelect }) {
  const [hov, setHov] = useState(false);
  const on = current || hov;
  const meta = {
    fontFamily: 'var(--font-digital)', fontSize: 13, color: 'var(--fg-muted)',
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div onClick={onSelect} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'clamp(14px, 1.8vw, 22px) 0',
        cursor: 'pointer', opacity: on ? 1 : 0.55,
        paddingLeft: hov ? 6 : 0,
        transition: 'opacity 0.25s, padding-left 0.25s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ ...meta, width: 26, textAlign: 'right' }}>{String(index + 1).padStart(2, '0')}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(17px, 1.6vw, 21px)', fontWeight: 'var(--heading-weight, 400)' }}>{track.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: current && playing ? 'var(--fg)' : 'var(--fg-muted)',
          opacity: on ? 1 : 0.4, transition: 'opacity 0.25s, color 0.25s',
        }}><TrackPlayIcon active={current && playing} /></span>
        <span style={meta}>{track.duration}</span>
      </div>
    </div>
  );
}

/* ═══ Itération 2 — briques partagées ═══ */

/* ── Dessins de Vania détourés ; l'encre suit le thème via --ink-invert ── */
function BrandIcon({ src, size = 22, alt = '' }) {
  return <img src={src} alt={alt} aria-hidden={alt ? undefined : 'true'} style={{
    width: size, height: size, objectFit: 'contain', display: 'block', filter: 'var(--ink-invert)',
  }} />;
}
function IconHome({ size = 29 }) {
  return <BrandIcon src="assets/brand/nav-home.svg" size={size} />;
}
function IconMountain({ size = 36 }) {
  return <BrandIcon src="assets/brand/nav-mountains.svg" size={size} />;
}
function IconStar({ size = 27 }) {
  return <BrandIcon src="assets/brand/nav-star.svg" size={size} />;
}
function IconMenu({ size = 29, open = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ transition: 'transform 0.3s ease' }}>
      {open ? (
        <g><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></g>
      ) : (
        <g><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="16" x2="20" y2="16" /></g>
      )}
    </svg>
  );
}

/* ── Icônes réseaux (contours 1.4, même graisse que les icônes maison) ── */
function IconInstagram({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFacebook({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 8.5h2.2M14.5 21V9.6c0-1.7 1-2.6 2.6-2.6h1.4M11 12.6h5.8" />
      <rect x="3" y="3" width="18" height="18" rx="5" />
    </svg>
  );
}
function IconVimeo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      {/* le « v » de Vimeo : montante fine, descendante qui s'incurve */}
      <path d="M7 9.4c.8-1 1.6-1.5 2.2-1.3.7.2 1 1.1 1.2 2.3.3 1.9.6 3.4 1.1 3.4.5 0 1.4-1 2.2-2.3.9-1.4 1.3-2.6 1.2-3.3-.1-.9-.8-1.2-1.7-1 .5-1.2 1.6-1.8 2.6-1.6.9.2 1.3 1 1.2 2.2-.2 2-1.8 5-3.5 6.8-1.4 1.5-2.6 1.9-3.4.8-.6-.8-1.2-2.9-1.8-4.9-.3-1-.7-1.4-1.3-1.1z" />
    </svg>
  );
}
function IconSpotify({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.2 9.1c3.1-.8 6.4-.5 9.2 1M7.9 12.3c2.5-.6 5.2-.4 7.5.9M8.7 15.4c2-.5 4.1-.3 5.9.7" />
    </svg>
  );
}
const SOCIAL_ICONS = {
  instagram: IconInstagram, facebook: IconFacebook, vimeo: IconVimeo, spotify: IconSpotify,
};

/* ── Html : HTML rendu au build depuis le Markdown de `content/` (contenu de l'autrice) ── */
function Html({ html, as: Tag = 'div', className, style }) {
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}

/* ── Blocs de contenu ──
   Même modèle partout (Coin lecture, infos d'album, news, résumé Kinematik, bio) :
   texte · image · vidéo · audio · lien. Le style typographique vient de `.vjm-prose`
   dans le gabarit HTML, pour que les balises produites par le Markdown en héritent. */
function VideoBlock({ b }) {
  const title = b.legende || 'Vidéo';
  return (
    <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
      {b.vimeoId ? (
        <iframe src={`https://player.vimeo.com/video/${b.vimeoId}`} title={title} loading="lazy"
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      ) : (
        <video src={b.url} controls preload="metadata" style={{ width: '100%', height: '100%', display: 'block' }} />
      )}
    </div>
  );
}

function Blocks({ blocks, className = '' }) {
  if (!blocks || !blocks.length) return null;
  return (
    <div className={`vjm-prose ${className}`}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'text':
            return <Html key={i} html={b.html} className={b.variante === 'liste' ? 'vjm-liste' : undefined} />;
          case 'image':
            return (
              <figure key={i}>
                <img src={b.src} alt={b.alt || ''} loading="lazy" />
                {b.legende && <figcaption>{b.legende}</figcaption>}
              </figure>
            );
          case 'video':
            return (
              <figure key={i}>
                <VideoBlock b={b} />
                {b.legende && <figcaption>{b.legende}</figcaption>}
              </figure>
            );
          case 'audio':
            return (
              <figure key={i}>
                {b.titre && <figcaption className="vjm-audio-title">{b.titre}</figcaption>}
                <audio src={b.src} controls preload="none" style={{ width: '100%' }} />
              </figure>
            );
          case 'lien':
            return (
              <p key={i}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">{b.label} ↗</a>
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/* ── SketchFrame : contour « fait à la main » ──
   Quatre traits indépendants qui débordent aux coins et fléchissent au milieu, comme un
   rectangle tracé au feutre. Le viewBox 0–100 est étiré sur la carte ; `non-scaling-stroke`
   garde un trait fin quelle que soit la taille. Le tracé dépend de `seed` : une même
   pop-up garde toujours le même dessin. */
function sketchPath(seed) {
  const r = (k, amp) => (seededRandom(seed * 13 + k) - 0.5) * 2 * amp;
  const f = (n) => n.toFixed(2);
  const side = (k, x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `M${f(x1 + r(k, 0.8))} ${f(y1 + r(k + 1, 0.8))} `
      + `Q${f(mx + r(k + 2, 1.2))} ${f(my + r(k + 3, 1.2))} `
      + `${f(x2 + r(k + 4, 0.8))} ${f(y2 + r(k + 5, 0.8))}`;
  };
  return [
    side(1, -1.2, 0.6, 101, 0),          // haut
    side(11, 99.6, -1.5, 100.3, 101.5),  // droite
    side(21, 101.2, 99.4, -0.8, 100.2),  // bas
    side(31, 0.2, 101.6, -0.3, -1.4),    // gauche
  ].join(' ');
}

function SketchFrame({ seed = 1, strokeWidth = 1.3 }) {
  const d = useMemo(() => sketchPath(seed), [seed]);
  const d2 = useMemo(() => sketchPath(seed + 7), [seed]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible',
      pointerEvents: 'none',
    }}>
      <path d={d} fill="none" stroke="var(--fg)" strokeWidth={strokeWidth} strokeLinecap="round"
        vectorEffect="non-scaling-stroke" />
      {/* second passage plus léger : la main repasse rarement exactement sur son trait */}
      <path d={d2} fill="none" stroke="var(--fg)" strokeWidth={strokeWidth * 0.5} strokeLinecap="round"
        vectorEffect="non-scaling-stroke" opacity="0.45" />
    </svg>
  );
}

/* ── IconButton (wrapper cliquable commun de l'en-tête) ── */
function IconButton({ children, onClick, title, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 6, lineHeight: 0,
        minWidth: 44, minHeight: 44,
        color: 'var(--fg)', opacity: active || hov ? 1 : 0.85, transition: 'opacity 0.25s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</button>
  );
}

/* ── Popup générique (overlay centré + ×) ──
   `sketch` : la carte perd sa bordure droite pour un contour dessiné, grandit, s'incline à
   peine et fait défiler son contenu — pour les textes longs, les images et les vidéos
   (infos d'album, texte de l'œil, news). */
function Popup({ children, onClose, backdrop = 'rgba(0,0,0,0.55)', maxWidth, padding, sketch = false, seed = 1, label }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const tilt = sketch ? `rotate(${((seededRandom(seed * 3) - 0.5) * 1.2).toFixed(2)}deg)` : '';
  const pad = padding || (sketch ? 'clamp(40px, 5vw, 60px) clamp(24px, 5vw, 64px)' : '48px 40px');
  /* Portail vers <body> : ouverte depuis une page, la pop-up hériterait sinon du `transform`
     de PageTransition — repère décalé par le défilement, et coincée sous l'en-tête. */
  return ReactDOM.createPortal(
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={label} style={{
      position: 'fixed', inset: 0, zIndex: 300, padding: sketch ? 'clamp(16px, 4vw, 40px)' : 24,
      background: show ? backdrop : 'rgba(0,0,0,0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.35s ease', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', background: 'var(--bg)', color: 'var(--fg)',
        maxWidth: maxWidth || (sketch ? 880 : 560), width: '100%',
        border: sketch ? 'none' : '1px solid var(--border)',
        opacity: show ? 1 : 0,
        transform: `${show ? 'translateY(0)' : 'translateY(12px)'} ${tilt}`,
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        {sketch && <SketchFrame seed={seed} />}
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 10, right: 12, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--fg)', fontSize: 24, lineHeight: 1, opacity: 0.6,
          zIndex: 1, width: 40, height: 40,
        }}>×</button>
        <div className={sketch ? 'vjm-scroll' : undefined} style={{
          padding: pad,
          maxHeight: sketch ? 'min(82vh, 900px)' : undefined,
          overflowY: sketch ? 'auto' : undefined,
          overscrollBehavior: 'contain',
        }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── SpotifyEmbed ──
   Pour « L'apparition des coquillages » : les 100 épisodes n'existent que sur Spotify, aucun
   master n'a été livré. Plutôt qu'un player local qui n'aurait rien à jouer, on intègre le
   lecteur du podcast. `theme=0` suit le thème du navigateur ; le cadre reste sans bordure
   pour ne pas jurer avec le reste de la page. */
function SpotifyEmbed({ src, title }) {
  return (
    <iframe src={`${src}?utm_source=generator&theme=0`} title={title} loading="lazy"
      /* 352 px : la hauteur que le lecteur Spotify dessine réellement pour un podcast.
         Plus haut, l'iframe laisse une bande vide sous la carte. */
      style={{ width: '100%', height: 352, border: 0, borderRadius: 12 }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
  );
}

/* ── MediaOverlay (lightbox image OU vidéo Vimeo, navigable × ‹ ›) ── */
function MediaOverlay({ items, index, onClose, onPrev, onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, onPrev, onNext]);

  const item = items[index];
  const isVideo = !!item.vimeoId;
  /* Résumé + générique d'un film : derrière un « i » manuscrit posé sous la vidéo. Le
     panneau se déplie SOUS le lecteur (qui rétrécit pour lui laisser la place) et défile
     seul : on lit le générique sans perdre l'image. */
  const hasInfo = isVideo && ((item.resume && item.resume.length) || (item.generique && item.generique.length));
  const [infoOpen, setInfoOpen] = useState(false);
  useEffect(() => { setInfoOpen(false); }, [index]);
  const videoWidth = infoOpen ? 'min(84vw, 1100px, calc((100vh - 380px) * 16 / 9))' : 'min(84vw, 1100px, calc((100vh - 170px) * 16 / 9))';
  const arrow = (dir, onClick) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={dir < 0 ? 'Précédent' : 'Suivant'}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [dir < 0 ? 'left' : 'right']: 'clamp(12px, 4vw, 48px)', zIndex: 2,
        background: 'none', border: 'none', cursor: 'pointer', color: '#eee',
        fontSize: 44, lineHeight: 1, opacity: 0.65, transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.65; }}
    >{dir < 0 ? '‹' : '›'}</button>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: show ? 'rgba(0,0,0,0.94)' : 'rgba(0,0,0,0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.4s ease', cursor: 'pointer',
    }}>
      <button onClick={onClose} aria-label="Fermer" style={{
        position: 'absolute', top: 18, right: 24, zIndex: 3, background: 'none', border: 'none',
        cursor: 'pointer', color: '#eee', fontSize: 30, lineHeight: 1, opacity: 0.8,
      }}>×</button>
      {items.length > 1 && arrow(-1, onPrev)}
      {items.length > 1 && arrow(1, onNext)}
      <div onClick={(e) => e.stopPropagation()} style={{
        opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.94)',
        transition: 'opacity 0.4s ease, transform 0.4s ease', cursor: 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {isVideo ? (
          <div style={{ width: videoWidth, aspectRatio: '16 / 9', background: '#000', transition: 'width 0.35s ease' }}>
            <iframe
              src={`https://player.vimeo.com/video/${item.vimeoId}${item.hash ? '?h=' + item.hash : ''}`}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={item.titre}></iframe>
          </div>
        ) : (
          <img src={item.src} alt={item.title} style={{ maxWidth: '86vw', maxHeight: '80vh', display: 'block' }} />
        )}
        {(isVideo || item.title) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <p style={{ color: '#bbb', fontSize: 15, fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.5 }}>
              {isVideo ? (
                <React.Fragment>
                  {item.titre}
                  {item.sousTitre && <React.Fragment><br />{item.sousTitre}</React.Fragment>}
                  <br />
                  <span style={{ fontFamily: 'var(--font-digital)', fontSize: 13 }}>
                    {item.trailer && 'Trailer · '}{item.duree} · {item.annee}
                  </span>
                </React.Fragment>
              ) : item.title}
            </p>
            {hasInfo && (
              <button onClick={() => setInfoOpen((v) => !v)} aria-expanded={infoOpen}
                aria-label={infoOpen ? 'Masquer le résumé' : 'Résumé et générique'} title="Résumé et générique"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: infoOpen ? 1 : 0.7, transition: 'opacity 0.2s',
                }}>
                {/* l'encre du « i » est noire : on l'inverse sur le fond sombre de la lightbox */}
                <img src="assets/brand/info-album-4.svg" alt="" aria-hidden="true"
                  style={{ width: 26, height: 26, objectFit: 'contain', filter: 'invert(1)' }} />
              </button>
            )}
          </div>
        )}
        {hasInfo && infoOpen && (
          <div className="vjm-scroll" style={{
            width: 'min(84vw, 760px)', maxHeight: 'max(140px, 30vh)',overflowY: 'auto', overscrollBehavior: 'contain',
            marginTop: 10, color: '#ddd', textAlign: 'left',
          }}>
            <Blocks blocks={item.resume} className="vjm-prose-small" />
            {item.generique && item.generique.length > 0 && (
              <dl style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6 }}>
                {item.generique.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <dt style={{ fontFamily: 'var(--font-digital)', fontSize: 12, color: '#999', minWidth: 120, paddingTop: 2 }}>{g.role}</dt>
                    <dd>{g.noms}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Export ── */
Object.assign(window, {
  seededRandom, useMediaQuery,
  HOME_PHOTOS, KINEMATIK, ALBUMS, CARNETS, PHOTOS, CARNETS_ALL, ALEAS, BIO, LECTURE, activeNews,
  SpotifyEmbed, ScrollReveal, ThemeToggle, PageTransition, Page, MasonryGrid, AudioPlayer,
  IconHome, IconMountain, IconStar, IconMenu, IconButton, BrandIcon, Popup, MediaOverlay,
  SOCIAL_ICONS, Blocks, Html, SketchFrame,
});
