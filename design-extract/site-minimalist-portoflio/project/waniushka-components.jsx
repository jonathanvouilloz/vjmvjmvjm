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

/* ── Data ── */
const SECTIONS = [
  { id: 'journaux', title: 'Journaux de bord', subtitle: 'Carnets', numeral: 'I' },
  { id: 'kinematik', title: 'Kinematik', subtitle: 'Vidéo · Films', numeral: 'II' },
  { id: 'instants', title: 'Instants capturés', subtitle: 'Photographie', numeral: 'III' },
  { id: 'films-oreilles', title: 'Films pour les oreilles', subtitle: 'Documents sonores', numeral: 'IV' },
  { id: 'fragments', title: 'Fragments de discours intérieurs', subtitle: 'Textes', numeral: 'V' },
];

const PLACEHOLDER_IMAGES = [
  { id: 1,  bg: 'linear-gradient(180deg, #2a2a2a 0%, #555 40%, #999 65%, #ddd 100%)', height: 320, title: 'Sans titre I' },
  { id: 2,  bg: 'radial-gradient(ellipse at 30% 35%, #aaa 0%, #333 55%, #111 100%)', height: 420, title: 'Mémoire diffuse' },
  { id: 3,  bg: 'linear-gradient(135deg, #eee 0%, #bbb 40%, #888 100%)', height: 240, title: 'Lumière rasante' },
  { id: 4,  bg: 'conic-gradient(from 45deg at 50% 50%, #222, #777, #222)', height: 360, title: 'Rotation' },
  { id: 5,  bg: 'linear-gradient(to right, #111 0%, #111 45%, #888 46%, #ddd 100%)', height: 280, title: 'Dualité' },
  { id: 6,  bg: 'radial-gradient(circle at 70% 30%, #f0f0f0 0%, #999 30%, #333 60%, #0a0a0a 100%)', height: 400, title: 'Éclipse' },
  { id: 7,  bg: 'linear-gradient(170deg, #ccc 0%, #eee 30%, #aaa 60%, #666 100%)', height: 250, title: 'Brume' },
  { id: 8,  bg: 'linear-gradient(to bottom, #050505 0%, #050505 55%, #333 56%, #777 80%, #bbb 100%)', height: 340, title: 'Abîme' },
  { id: 9,  bg: 'radial-gradient(ellipse at 50% 80%, #ddd 0%, #999 40%, #444 100%)', height: 300, title: 'Réminiscence' },
  { id: 10, bg: 'linear-gradient(225deg, #222 0%, #555 50%, #999 100%)', height: 260, title: 'Fragment VII' },
  { id: 11, bg: 'conic-gradient(from 180deg at 30% 70%, #111, #666, #bbb, #666, #111)', height: 380, title: 'Vertige' },
  { id: 12, bg: 'linear-gradient(90deg, #ddd 0%, #aaa 20%, #666 50%, #333 80%, #111 100%)', height: 290, title: 'Passage' },
  { id: 13, bg: 'radial-gradient(circle at 50% 50%, #eee 0%, #bbb 25%, #777 50%, #333 100%)', height: 310, title: 'Empreinte' },
  { id: 14, bg: 'linear-gradient(160deg, #111 0%, #333 30%, #888 70%, #ccc 100%)', height: 270, title: 'Seuil' },
  { id: 15, bg: 'conic-gradient(from 90deg at 60% 40%, #000, #444, #999, #ddd, #999, #444, #000)', height: 350, title: 'Dispersion' },
];

const TRACKS = [
  { id: 1, title: 'Murmures du matin', duration: '4:32', sec: 272 },
  { id: 2, title: 'Les voix du marché', duration: '6:15', sec: 375 },
  { id: 3, title: 'Pluie sur le toit', duration: '3:48', sec: 228 },
  { id: 4, title: 'Conversation oubliée', duration: '5:21', sec: 321 },
  { id: 5, title: 'Le silence entre nous', duration: '7:03', sec: 423 },
  { id: 6, title: 'Dernier train', duration: '4:47', sec: 287 },
];

const FRAGMENTS_TEXT = [
  { id: 1, text: 'Je marche sans direction, et c\'est peut-être la seule direction qui vaille.', date: '14 mars' },
  { id: 2, text: 'Les murs de cette ville parlent une langue que je commence seulement à comprendre.', date: '2 avril' },
  { id: 3, text: 'Il y a dans le silence une musique que l\'oreille distraite ne perçoit pas.', date: '18 avril' },
  { id: 4, text: 'Chaque photographie est un mensonge magnifique — une seconde qui prétend contenir l\'éternité.', date: '7 mai' },
  { id: 5, text: 'Nous sommes tous des étrangers pour nous-mêmes, simplement certains l\'acceptent mieux que d\'autres.', date: '23 mai' },
  { id: 6, text: 'Le temps ne passe pas. Il s\'accumule.', date: '1 juin' },
  { id: 7, text: 'Photographier, c\'est retenir son souffle assez longtemps pour que le monde s\'imprime.', date: '19 juin' },
];

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

/* Kinematik : films (extraits du docx). vimeoId → player.vimeo.com/video/{id}
   Les titres à rallonge sont coupés en `titre` + `sousTitre` (deux lignes) plutôt qu'assemblés
   par un tiret : sur une vignette étroite, le tiret tombait n'importe où. Graphie fixée par
   l'exemple de Vania : « Carte Postale de Montevidéo #1 » puis « Opération Béton ».

   `trailer` : le docx de sélection le signale film par film. C'est affiché, parce que ça
   explique une durée de deux minutes là où le film en fait quatre-vingt-dix.

   Les vignettes sont dans `assets/kinematik/{id}.jpg`, rapatriées de Vimeo par
   tools/fetch-thumbs.py — la page ne dépend plus d'un service tiers pour ses images.
   Seul `k4` a un poster réellement noir côté Vimeo, à changer là-bas. */
const KINEMATIK = [
  { id: 'k1',  titre: 'Charles Lloyd, Dreamer in Sound', duree: "2'11\"", annee: 2016, vimeoId: '149041859', trailer: true },
  { id: 'k2',  titre: 'Beyond the Trees',                duree: "2'17\"", annee: 2011, vimeoId: '298725112', hash: '5a560bc308' },
  { id: 'k3',  titre: "Chronique d'une performance",     duree: "1'21\"", annee: 2026, vimeoId: '1127787853', trailer: true },
  { id: 'k4',  titre: 'Carte Postale de Montevidéo #1', sousTitre: 'Opération Béton',  duree: "1'54\"", annee: 2019, vimeoId: '312116169' },
  { id: 'k5',  titre: 'Carte Postale de Montevidéo #2', sousTitre: "L'uru what",       duree: "3'59\"", annee: 2019, vimeoId: '318214050' },
  { id: 'k6',  titre: 'Carte Postale de Montevidéo #3', sousTitre: 'R-évolution',      duree: "4'26\"", annee: 2020, vimeoId: '331419879' },
  { id: 'k7',  titre: 'Carte Postale de Montevidéo #4', sousTitre: 'Les Audacieuses',  duree: "5'23\"", annee: 2020, vimeoId: '331226065' },
  { id: 'k8',  titre: 'Carte Postale de Montevidéo #5', sousTitre: 'Le Cube',          duree: "5'33\"", annee: 2020, vimeoId: '336954564' },
  { id: 'k9',  titre: 'Ciné-poème',                      duree: "6'46\"", annee: 2000, vimeoId: '312855726' },
  { id: 'k10', titre: 'Haïku #1',                        duree: "1'00\"", annee: 2017, vimeoId: '243475972' },
  { id: 'k11', titre: 'Haïku #2',                        duree: "1'00\"", annee: 2017, vimeoId: '243478147' },
  { id: 'k12', titre: 'Rhomba',                          duree: "3'12\"", annee: 2021, vimeoId: '606812272' },
];

/* Films pour les oreilles : 3 albums.
   `infos` est un tableau de segments rendu par `RichText` (comme la bio) : la pop-up du « i »
   peut donc porter des liens. `episodes[].src` pointe le MP3 déposé par tools/fetch-audio.py ;
   `sec` et `duration` viennent de ffprobe, plus d'une estimation.
   Un album sans `episodes` mais avec un `spotify` s'affiche en lecteur Spotify intégré. */
const ALBUMS = [
  {
    id: 'coquillages',
    titre: "L'apparition des coquillages",
    infos: [
      "J'ai décidé de partir sur le chemin de Saint-Jacques de Compostelle, seule, à pied, sans argent (du tout), d'octobre 2021 à janvier 2022, et je vous raconte ici, où en est l'humanité. Les 100 épisodes sont aussi disponibles sur ",
      { t: 'Spotify', href: 'https://open.spotify.com/show/4qmj0UuzPkLPpDFqxgd2MY' },
      '.',
    ],
    /* Aucun fichier n'existe hors de Spotify : le journal n'a jamais été masterisé
       épisode par épisode. On intègre donc le lecteur du podcast plutôt que de simuler
       une écoute qui n'aurait rien à jouer. */
    spotify: 'https://open.spotify.com/embed/show/4qmj0UuzPkLPpDFqxgd2MY',
  },
  {
    id: 'mourir',
    titre: "Mourir c'est pas si grave",
    infos: ["Est-ce que la vie s'arrête un jour ? Je suis allée en discuter avec quelques chercheurs, un moine bouddhiste, une directrice de pompes funèbres, deux médiums, un médecin en soins palliatifs… Et je raconte quelques petites histoires personnelles qui m'ont fait douter de la mort."],
    /* Deux épisodes, pas six : le montage final réunit la matière en deux volets de 55 min
       (« Version 2 épisodes de 54' » dans le document de Vania). Les masters ne portent que
       « Episode #1 / #2 » — les vrais titres sont à lui demander. */
    episodes: [
      { id: 1, title: 'Épisode 1', duration: '55:21', sec: 3321, src: 'assets/audio/mourir/1.mp3' },
      { id: 2, title: 'Épisode 2', duration: '56:07', sec: 3367, src: 'assets/audio/mourir/2.mp3' },
    ],
  },
  {
    id: 'chronique',
    titre: 'Chroniques du dernier souffle',
    infos: ["En me baladant dans les méandres du festival Archipel, à Genève, je récolte de belles histoires vécues ou entendues, qui ont à voir avec notre finitude, avec le passage de cet état animé à cet autre état, dont on ne sait pas grand-chose. L'âme, qui s'apparenterait au souffle selon son étymologie, abandonnerait notre corps, en s'élançant du bord de nos lèvres lors de notre dernier souffle."],
    episodes: [
      { id: 1, title: 'Fumée et Pardon',      duration: '9:50',  sec: 590, src: 'assets/audio/chronique/1.mp3' },
      { id: 2, title: 'Lise Barkas',          duration: '9:27',  sec: 567, src: 'assets/audio/chronique/2.mp3' },
      { id: 3, title: 'Le Souffle des Morts', duration: '10:31', sec: 631, src: 'assets/audio/chronique/3.mp3' },
    ],
  },
];

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

/* Bio — texte intégral repris de JONATHAN/Bio VJM.odt.
   Les paragraphes de `filmo` et `art` sont des tableaux de segments : une chaîne = du texte,
   un objet `{t, href}` = un lien. Vania veut pouvoir pointer les collaboratrices et
   collaborateurs qu'elle cite ; c'est extensible sans toucher au rendu. */
const BIO = {
  intro: [
    'VJM est une citoyenne cosmopolite qui chante « no soy ni de aquí ni de allá ».',
    'Elle est en quête d\'une façon d\'habiter ce monde, en quête de sens, et parfois même en quête d\'absolu.',
    'Comme tout le monde elle a appris des trucs à l\'école mais surtout en-dehors. Puis, elle a fait quelques rencontres qui l\'ont éclairée, un peu ou beaucoup.',
    'Et comme tout le monde elle fait plusieurs trucs dans la vie. Sa spécialité ? Les réponses cosmiques et artisanales aux questions existentielles, fréquentielles et pragmatiques.',
    'Et enfin, comme presque tout le monde, elle pense qu\'elle va devoir mourir un jour, mais elle sait pas encore la date. D\'ici là, elle milite pour le droit à la tendresse.',
  ],
  filmo: [
    ['Réalisatrice et productrice suisse d\'origine chilienne, russe et japonaise, elle cofonde HandMade Films en 2007, au sein de laquelle elle commence à produire des courts-métrages documentaires et de fiction, ainsi que des clips musicaux.'],
    ['Elle réalise plusieurs portraits d\'artistes, sensible à leur rapport au monde, à travers la technologie (« Nourathar », 2014, Visions du Réel), le cinéma (« Nice Time(s) », 2015), la méditation (« Charles Lloyd, Dreamer in Sound », 2016) ou encore la provocation (« Chronique d\'une performance », 2025), interrogeant sans cesse notre condition humaine.'],
    ['Parallèlement, dans ses courts-métrages de fiction, elle développe un univers personnel, obsessionnellement centré sur des figures féminines inaptes à communiquer et en quête de liberté.'],
    ['Dès 2019, elle travaille avec Mnemosyn Films, pour qui elle produit deux films de Charlie Petersmann : « Rois Mages » (Soleure, Winterthur) et « À Ciel Ouvert » (Soleure), tous deux consacrés à des questions d\'exclusion et de marges sociales.'],
    [
      'Depuis 2022, elle collabore avec le collectif ',
      { t: 'Écran Mobile', href: 'https://ecran-mobile.ch/' },
      ', au sein duquel elle produit « Habiter le monde » de Laura Gabay, tout en poursuivant un travail personnel désormais centré sur la liberté avec le journal sonore « L\'Apparition des coquillages » (2022) et la recherche sur la conscience et la mort avec le documentaire sonore « Mourir c\'est pas si grave » (2026).',
    ],
  ],
  art: [
    ['Curatrice de l\'exposition Mondes Parallèles, Mapping Festival, Commun, Genève, 2022.'],
    ['Curatrice de Whall, fresque murale, d\'Abigail Janjic, Picto, 2018.'],
    ['DA du nouveau site web de l\'association Picto, 2017.'],
    ['Curatrice d\'une série d\'interventions architecturales, Picto, Genève, 2015.'],
    ['Création et co-gestion de TOPIC, résidence curatoriale et espace d\'art indépendant, Genève, 2014-21.'],
    ['Membre de la Commission du cinéma de la Ville de Genève, 2008-10.'],
  ],
  /* Le @ tient lieu du second « a » de Vania : vani + @ + vjmvjmvjm.com */
  email: 'vani@vjmvjmvjm.com',
  iban: 'CH03 8080 8005 8046 1298 3',
  social: [
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/waniushka' },
    { id: 'facebook',  label: 'Facebook',  url: 'https://www.facebook.com/waniouchka' },
    { id: 'vimeo',     label: 'Vimeo',     url: 'https://vimeo.com/waniouchka' },
    { id: 'spotify',   label: 'Spotify',   url: 'https://open.spotify.com/show/4qmj0UuzPkLPpDFqxgd2MY' },
  ],
  /* Série d'autoportraits fournie par Vania : la page bio en tire un au hasard à chaque
     visite, comme l'accueil tire sa photo. */
  portraits: PORTRAITS_SRC.map((p) => p.src),
};

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
      aria-label="Toggle theme" style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 8,
        color: 'var(--fg)', opacity: hov ? 1 : 0.5, transition: 'opacity 0.3s',
      }}>
      {theme === 'light' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )}
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

/* ── ImageOverlay (lightbox) ── */
function ImageOverlay({ item, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: show ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.4s ease', cursor: 'pointer',
    }}>
      <div style={{
        width: '70vmin', maxWidth: 620, height: item.height * 1.3,
        maxHeight: '70vh', background: item.bg,
        opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.92)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}></div>
      <p style={{
        color: '#999', fontSize: 13, marginTop: 20, fontFamily: 'var(--font-body)',
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.15s',
      }}>{item.title}</p>
    </div>
  );
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
          fontFamily: 'var(--font-digital)', fontSize: 11, lineHeight: 1,
          color: current && playing ? 'var(--fg)' : 'var(--fg-muted)',
          opacity: on ? 1 : 0.4, transition: 'opacity 0.25s, color 0.25s',
        }}>▶</span>
        <span style={meta}>{track.duration}</span>
      </div>
    </div>
  );
}

/* ═══ Itération 2 — briques partagées ═══ */

/* ── Icônes SVG (placeholders manuscrits ; theme-aware via currentColor) ── */
function IconHome({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 L12 4 L20 11.5" /><path d="M6 10.5 V20 H18 V10.5" />
    </svg>
  );
}
function IconMountain({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20 L9 8 L13 14 L17 6 L26 20 Z" />
    </svg>
  );
}
function IconStar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 V22 M2 12 H22 M4.9 4.9 L19.1 19.1 M19.1 4.9 L4.9 19.1" />
    </svg>
  );
}
function IconMenu({ size = 24, open = false }) {
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

/* ── RichText : rend un paragraphe composé de chaînes et de segments { t, href } ── */
function RichText({ parts }) {
  return (
    <React.Fragment>
      {parts.map((p, i) => (typeof p === 'string' ? (
        <React.Fragment key={i}>{p}</React.Fragment>
      ) : (
        <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" style={{
          color: 'inherit', textDecoration: 'underline',
          textDecorationColor: 'var(--fg-subtle)', textUnderlineOffset: '0.18em',
          transition: 'text-decoration-color 0.25s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecorationColor = 'var(--fg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecorationColor = 'var(--fg-subtle)'; }}
        >{p.t}</a>
      )))}
    </React.Fragment>
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
        color: 'var(--fg)', opacity: active || hov ? 1 : 0.55, transition: 'opacity 0.25s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</button>
  );
}

/* ── Popup générique (overlay centré + ×) ──
   `backdrop` s'allège pour les aléas du jour : Vania veut continuer à voir la page derrière. */
function Popup({ children, onClose, backdrop = 'rgba(0,0,0,0.55)', maxWidth = 560, padding = '48px 40px' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300, padding: 24,
      background: show ? backdrop : 'rgba(0,0,0,0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.35s ease', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', background: 'var(--bg)', color: 'var(--fg)',
        maxWidth, width: '100%', padding,
        border: '1px solid var(--border)',
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--fg)', fontSize: 22, lineHeight: 1, opacity: 0.6,
          zIndex: 1,
        }}>×</button>
        {children}
      </div>
    </div>
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
          <div style={{ width: '84vw', maxWidth: 1100, aspectRatio: '16 / 9', background: '#000' }}>
            <iframe
              src={`https://player.vimeo.com/video/${item.vimeoId}${item.hash ? '?h=' + item.hash : ''}`}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={item.titre}></iframe>
          </div>
        ) : (
          <img src={item.src} alt={item.title} style={{ maxWidth: '86vw', maxHeight: '80vh', display: 'block' }} />
        )}
        {(isVideo || item.title) && (
          <p style={{ color: '#bbb', fontSize: 15, marginTop: 16, fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.5 }}>
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
        )}
      </div>
    </div>
  );
}

/* ── Export ── */
Object.assign(window, {
  seededRandom, useMediaQuery,
  SECTIONS, PLACEHOLDER_IMAGES, TRACKS, FRAGMENTS_TEXT,
  HOME_PHOTOS, KINEMATIK, ALBUMS, CARNETS, PHOTOS, CARNETS_ALL, ALEAS, BIO, SpotifyEmbed,
  ScrollReveal, ThemeToggle, PageTransition, Page, ImageOverlay, MasonryGrid, AudioPlayer,
  IconHome, IconMountain, IconStar, IconMenu, IconButton, Popup, MediaOverlay,
  SOCIAL_ICONS, RichText,
});
