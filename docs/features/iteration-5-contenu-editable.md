# Feature — Itération 5 : contenu éditable, Coin lecture, news, bio FR/EN

## Etat session 2026-09-17 — DONE (maquette), CMS à activer

Troisième liste de retours de Vania. Deux changements de fond :

- **le contenu sort du code** : c'est le socle du CMS git-based (Sveltia) ;
- **le Coin lecture devient une vraie section.**

Le reste est une série de retouches ciblées.

### Le contenu éditable (`content/` → `window.CONTENT`)

| Fichier | Contient |
|---|---|
| `content/site.json` | email, IBAN, réseaux, `bioOeilVisible`, `policeMenu` |
| `content/bio.json` | `fr` / `en` → `pro` (page) et `perso` (derrière l'œil), en blocs |
| `content/kinematik.json` | `films[]` + `mention`, `resume` (blocs), `generique[]` |
| `content/albums.json` | `albums[]`, `infos` en blocs, `episodes[]` ou `spotify` |
| `content/news.json` | `news[]` : `actif`, `debut`, `fin`, `mode` (`popup` ou `lien`), `url`, `blocks` |
| `content/lecture/*.json` | un texte par fichier : `titre`, `surtitre`, `contexte`, `contextePosition`, `vignette`, `blocks`, `notes` |

**Modèle de blocs partagé.** Il y a cinq types, discriminés par `type` : `text {md, variante?}` · `image {src, alt, legende}` · `video {vimeoId | url, legende}` · `audio {src, titre}` · `lien {label, url}`. Sveltia/Decap l'éditent nativement (`list` + `types`), sans composant sur mesure.

**Build.** `tools/build-content.mjs` lit `content/`. Toute propriété `md` y reçoit une sœur `html`, rendue avec `marked` :
- les liens externes s'ouvrent dans un nouvel onglet ;
- `[^n]` devient un appel de note ancré (`#note-n` / `#ref-n`) ;
- les espaces insécables sont posés (« », ? ! : ;).

`precompile.mjs` pose le résultat sur `window.CONTENT` avant les composants. Il remplace aussi la police du menu (Google Fonts + `--font-menu`) d'après `site.json`, et copie `admin/`, `public/robots.txt` et `public/sitemap.xml` dans `dist/`.

**CMS.** `admin/index.html` charge Sveltia depuis unpkg, `admin/config.yml` décrit tout (l'ancre YAML `&blocks` est posée sur le champ `blocks` du Coin lecture). Le backend est `github`, avec `repo: OWNER/wania` à remplacer. En attendant, « Travailler avec un dépôt local » marche déjà dans Chrome sur localhost. Les médias uploadés vont dans `assets/uploads/`.

### Retouches

- **Aléa du jour** au singulier. Email `vania@vjmvjmvjm.com`. L'IBAN s'affiche seul, sans phrase.
- **Menu** : les titres passent en **Open Sans** (`--font-menu`).
- **`DotField`** : un semis de points d'encre qui s'enroulent autour du curseur puis reviennent à leur place. C'est une variante du grain d'iirrm.ch. Il s'arrête au tactile et en mouvement réduit, et la boucle s'endort au repos.
- **Kinematik** :
  - `mention` : une étiquette toujours visible en bas à gauche de la vignette ;
  - dans la lightbox, un « i » manuscrit (`info-album-4.svg`) sous la vidéo déplie le résumé et le générique ; la vidéo rétrécit pour leur laisser la place. Le « i » n'apparaît que si l'un des deux est rempli.
- **`Popup sketch`** : un contour tracé à la main (`SketchFrame`, quatre traits SVG qui débordent), une carte plus grande et légèrement inclinée, un contenu qui défile. Il sert aux infos d'album, au texte de l'œil et à la news. `Popup` passe par un **portail** vers `<body>` : ouverte depuis une page, elle héritait du `transform` de `PageTransition`, ce qui la décalait et la glissait sous l'en-tête.
- **Coin lecture** :
  - un collage de vignettes (titre, extrait ou image) au cadre dessiné, avec retour par la flèche seule ;
  - un clic ouvre `ReadingText` en colonne de lecture, avec « retour au coin lecture » ;
  - le contexte se place en haut ou en bas ;
  - les notes font l'aller-retour par `scrollIntoView`, sans toucher à l'URL.
  - Texte de test : `content/lecture/ma-mere.json`, avec `024-oiseau-de-feu.jpg` et une note.
- **News** : `NewsTag` sous le nom, uniquement si une annonce est active et dans ses dates. Au clic, pop-up dessinée ou lien externe. L'exemple livré est **inactif**.
- **Bio** :
  - les textes sont inversés : le texte sérieux sur la page, avec un sélecteur FR/EN mémorisé en `localStorage` ;
  - le texte « La vérité c'est que VJM… » passe derrière **un œil seul** (`nav-eye-middle.svg`), masquable par `bioOeilVisible` ;
  - la traduction EN est un brouillon (`aValider: true`).
- **Référencement** :
  - title/description/OG avec le nom complet ;
  - JSON-LD `Person` avec `sameAs` ;
  - `h1` et texte présents dans `#root` avant React ;
  - `robots.txt` (qui exclut `/admin/`) et `sitemap.xml`.
- Nettoyage : données fictives de l'itération 1, `ImageOverlay`, `RichText` et `SIGLES.biofilmo` supprimés.

### Vérifié

- `npm test` : 25 tests verts.
- Parcours Playwright (desktop clair, mobile sombre) sur le build de travail **et** sur `dist/` : menu et curseur, news, mention et « i » Kinematik, infos d'album, collage → texte → note aller-retour → retour, bio FR/EN (persistance) et pop-up de l'œil, contact.
- Seule erreur console : le 401 Vimeo, déjà connu.
- `/admin/` charge Sveltia sans erreur de config.

### Reste / bloqué hors code

Voir `cerveau/10-Projets/wania/wania-human.md` :
- boîte `vania@` ;
- relecture de la bio EN ;
- titre du livre « xxx » ;
- repo GitHub + Netlify git pour activer le CMS ;
- Search Console ;
- liens depuis les profils de Vania.

À surveiller pour le CMS : `npm run build` sur Netlify appelle `tools/optimize-dist.py` (ffmpeg) et `tools/import-vector-sigles.py`. Il faudra soit les rendre optionnels côté CI, soit committer l'audio déjà optimisé.

## Carte du code

- `content/*.json`, `content/lecture/*.json` — données éditables
- `tools/build-content.mjs` — lecture de `content/` + Markdown → HTML
- `precompile.mjs` — injection de `window.CONTENT`, police du menu, copie de `admin/` et `public/`
- `admin/index.html`, `admin/config.yml` — Sveltia CMS
- `public/robots.txt`, `public/sitemap.xml`
- `design-extract/site-minimalist-portoflio/project/waniushka-components.jsx` — `CONTENT`, `activeNews`, `Blocks`, `Html`, `SketchFrame`, `Popup` (sketch + portail), `MediaOverlay` (« i »)
- `design-extract/site-minimalist-portoflio/project/waniushka-app.jsx` — `NewsTag`, `DotField`, `KinTile` (mention), `ReadingTile`/`ReadingPage`/`ReadingText`, `LangSwitch`/`BioPage`, `App`
- `design-extract/site-minimalist-portoflio/project/Waniushka Portfolio.html` — SEO, Open Sans, styles `.vjm-prose` / `.vjm-notes`
- `tests/site.test.mjs`
