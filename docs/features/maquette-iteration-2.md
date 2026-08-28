# Feature — Maquette itération 2 (IA wireframes Vania)

## Etat session 2026-08-08 — itération 4 : lisibilité, contenu réel, audio

Deuxième liste de retours de Vania, plus la livraison de son dossier complet. Trois axes :
la lisibilité (elle a fait relire la bio, le lecteur a décroché devant la manuscrite), la
fidélité au contenu (trailers, pluriel, mention Spotify au bon endroit), et le passage au
contenu réel (images, sons, vignettes).

**Fait :**

- **Bio en deux temps.** La page ne garde que le texte de présentation, en **Newsreader** et
  non plus en Arsenale White (`clamp(1.15rem, 1.6vw, 1.35rem)`, un cran au-dessus du corps).
  Le CV réel — biofilmographie + art contemporain — part dans une pop-up derrière un lien
  « Biofilmographie » encadré des **deux caméras dessinées** par Vania
  (`sigles_caméras.jpeg` → `sigle-camera-1/2.png`). `Popup` ne défile pas : le contenu est
  enveloppé dans un `maxHeight: 70vh; overflowY: auto` local, plutôt que de modifier une
  carte partagée avec les aléas et les infos d'album. `Sigle` gagne `srcLeft` (les deux
  caméras sont deux dessins distincts, pas un miroir).
- **Les deux polices sous licence non commerciale disparaissent.** Arsenale White n'a plus
  d'usage (bio en Newsreader) et Learning Curve non plus (les aléas sont désormais des
  scans). `--font-bio` et `--font-hand` retirés du gabarit **et** de `useGlobalTypo`.
  Les fichiers restent dans `assets/fonts/` pour l'archive mais sont exclus du build prod.
  **Le blocage licence de la mise en ligne saute.**
- **Aléas du jour = l'écriture de Vania.** Ses 24 phrases manuscrites (`JONATHAN/Aléas
  quotidien (*étoile*)/`) détourées en PNG transparents, encre inversée en thème sombre.
  `AleaText` (animation mot à mot) devient `AleaImage` (même fondu-flou sur l'image entière).
- **Films pour les oreilles — contenu réel.** « Chronique » → « **Chroniques** du dernier
  souffle ». Mention Spotify sortie de la page album, replacée en fin du texte du « i »,
  **en lien** : `infos` devient un tableau de segments rendu par `RichText`. Titres réduits
  (liste `1.85rem → 1.45rem`, titre de page `2.3rem → 1.7rem`).
- **Le player joue vraiment.** `AudioPlayer` abandonne le `setInterval` simulé pour un
  `new Audio()` avec `preload="none"` : `timeupdate` alimente la position, `ended` enchaîne,
  le clic sur la barre fait un vrai seek, les 4 sauts sont des `currentTime ± 30/60`.
  L'UI ne bouge pas d'un pixel.
- **Data audio corrigées par les fichiers eux-mêmes.** « Mourir c'est pas si grave » passe de
  **6 épisodes fictifs à 2 réels** (55:21 et 56:07 — le montage final est en deux volets),
  « Chroniques » garde ses 3 titres mais avec les vraies durées (9:50 / 9:27 / 10:31, contre
  22:10 / 19:47 / 24:33 inventées). « L'apparition des coquillages » n'a **aucun** master :
  ses 100 épisodes n'existent que sur Spotify → nouveau `SpotifyEmbed` à la place du player.
- **Kinematik « bordélique ».** Le `flex-wrap` ne pouvait pas accueillir des formats variés :
  avec `align-items: flex-start`, chaque vignette verticale creusait un trou de sa hauteur.
  Passage en **colonnes CSS**, comme le collage des carnets, plus formats mêlés
  (`KIN_RATIOS` : 16/9, 1/1, 4/3, 3/4, 5/4, 4/5 en `objectFit: cover`), rotation ±2,5°,
  décalage horizontal dans la colonne, liseré et padding occasionnels — mêmes seuils que
  `MasonryGrid`. Le survol compose avec la rotation de base au lieu de redresser la vignette.
- **Trailers signalés** (`trailer: true` sur `k1` Charles Lloyd et `k3` Chronique d'une
  performance, d'après le docx de sélection), affiché au survol et dans la lightbox.
- **Vignettes noires réglées.** Ce n'était pas Vimeo mais **vumbnail.com**, le service tiers
  qui servait les miniatures : il rendait un aplat noir pour trois films et une image de
  cadenas pour la vidéo privée. Nouveau `tools/fetch-thumbs.py` : oEmbed officiel (qui
  accepte le hash des vidéos non répertoriées) → `assets/kinematik/{id}.jpg`. 11 vignettes
  sur 12 ont désormais une vraie image ; **seul `k4` (Opération Béton) a un poster
  réellement noir côté Vimeo**, à changer là-bas.
- **Toutes les images du dossier.** Le site en affichait 10 sur 53 (carnets) et 13 sur 64
  (photos). Nouveau `tools/import-images.py`, idempotent : EXIF transposé (plusieurs carnets
  étaient couchés), TIFF → JPEG, noms ASCII dérivés du titre, deux tailles. Il écrit
  `waniushka-assets.jsx`, un fichier de data **généré** que le bundle consomme — plus rien
  n'est listé à la main. 53 carnets + 64 photos + 15 autoportraits + 24 aléas.
- **Vignettes de collage.** Le collage aligne maintenant 117 images sur une page : `-t` à
  700 px pour la grille, pleine résolution réservée à la lightbox. Les attributs
  `width`/`height` réservent la place avant chargement.
- **Portrait de bio aléatoire** parmi les 15 autoportraits (`BIO.portrait` → `BIO.portraits`).
- Vérifié sous Chromium (Playwright), **clair et sombre**, sur le build de travail **et** le
  build de prod : toutes les pages, la pop-up biofilmographie, les aléas, le collage, le
  survol Kinematik, la lecture audio (lecture / pause / seek / saut +1 min / enchaînement de
  piste), l'embed Spotify. **Zéro erreur console, zéro requête locale en échec.**

**Deux pièges rencontrés :**
- `python -m http.server` **ignore l'en-tête `Range`** et renvoie toujours le fichier entier :
  tout saut dans un MP3 non encore téléchargé ramenait la lecture à zéro. Ce n'est pas un bug
  du player — Netlify répond 206 — mais ça le rendait intestable. D'où `tools/serve.py`, un
  serveur de preview qui gère les plages (et prend un dossier en argument, pour vérifier `dist`).
- `ScrollReveal` recevait `delay={i * 50}` : avec 117 images, la dernière attendait près de
  six secondes, y compris une fois amenée à l'écran. Passé en rouleau `(i % 8) * 50`.
- `precompile.mjs --prod` copiait sans jamais supprimer : les polices retirées survivaient
  dans `dist/`. La copie repart maintenant d'un `dist/assets` vide.

### Ce qui bloque encore, et qui n'est pas de notre ressort
**Les 12 vidéos Vimeo refusent l'embed (HTTP 401)** — testé une à une, y compris avec le hash.
C'est un réglage de confidentialité côté Vimeo (« où cette vidéo peut être intégrée »), et il
est **antérieur à cette session** : la lightbox vidéo n'a jamais rien pu afficher en preview.
Le domaine de production devra être autorisé sur chaque vidéo, sans quoi la page Kinematik
montrera douze vignettes qui n'ouvrent rien.

### Poids
`dist/` pèse **102 Mo**, dont 65 Mo d'audio : MP3 mono **64 kbps** (2 × 27 Mo pour « Mourir »,
3 × 5 Mo pour « Chroniques »). Un premier essai à 96 kbps donnait 40 Mo par épisode de
« Mourir » et 134 Mo de build — c'est de la parole, 64 kbps suffit. Les masters bruts restent
dans `.audio-cache/` (605 Mo), hors build : réencoder ne re-télécharge rien, il suffit de
changer `BITRATE` dans `tools/fetch-audio.py`.

Le zip Netlify (`tools/package-netlify.py`) fait 105 Mo. Il ne compresse rien — tout le poids
est en JPEG et MP3 déjà compressés, qu'on stocke donc en `ZIP_STORED`.

---

## Etat session 2026-07-30 — itération 3 : retours Vania

Passe de corrections sur la liste de retours envoyée par Vania après relecture de l'itération 2.
Aucune refonte : comportements, hiérarchie typographique, contenu.

**Fait :**
- **Aléas du jour → vraie pop-up.** `AleaOverlay` (voile plein écran + blur) remplacé par un
  `AleaText` rendu dans le `Popup` générique : carte centrée, croix en haut à droite, page
  courante lisible dessous. Plus de label « aléas du jour » ni de « cliquer pour refermer ».
  `Popup` gagne trois props (`backdrop`, `maxWidth`, `padding`) ; les aléas passent à
  `rgba(0,0,0,0.28)` au lieu de 0.55.
- **Hamburger → menu déroulant.** `MenuOverlay` (page plein écran opaque) devient `MenuDropdown` :
  panneau ancré sous le bouton, à droite, sur fond de page visible. `SectionTitleButton` prend une
  prop `size` (`page` ≈ 2rem / `menu` ≈ 1.02rem).
- **Contact en carte postale.** Colonnes inversées : dessin à gauche, formulaire à droite
  (`order` remis à l'endroit sous 760 px, sinon le canvas 60vh enterrait le formulaire).
  Sigles `⌒` → **avion `✈`**, celui de gauche retourné en `scaleX(-1)` (Vania proposait `⏅`,
  glyphe absent des polices du site). Palette du canvas remontée de `bottom: 0` à `top: 0`.
  Quatre liens réseaux (IG/FB/Vimeo/Spotify) au-dessus de l'adresse. « À toutes fins utiles »
  retiré. **Email corrigé : `vania@vvvjjjmmm.com` → `vani@vjmvjmvjm.com`** (le `@` tient lieu du
  second « a » de Vania — le domaine ET la partie locale étaient faux).
- **Titres de page remplacés par une flèche de retour** sur Kinematik, Films et Carnets, au même
  endroit que le retour de la page Album. Nouveau composant `BackLink` partagé, avec une flèche
  dessinée en SVG : le chevron `‹` de la serif se réduit à une virgule quand il est seul.
- **Kinematik** : survol franc (calque `var(--bg)` à `opacity: 1` au lieu d'une image atténuée à
  0.35 — la durée était illisible selon la photo) ; titres à rallonge coupés en `titre` +
  `sousTitre` sur deux lignes, sans tiret ; graphie de Vania appliquée (« Montevidéo »,
  « Opération Béton »).
- **Player audio réorganisé** : play seul en tête de ligne ; les 4 sauts descendent sous la barre,
  juste après le minuteur, en chevrons `« ‹ › »` sans libellés « 30s »/« 1min » (l'info reste dans
  les `title`) ; liste d'épisodes sans filets, avec un `▶` discret à droite. Titres d'album
  `2.6rem → 1.85rem`, titre de page album `3rem → 2.3rem`.
- **Carnets de voyage**s (pluriel) : les 13 photos d'accueil rejoignent le collage, entières cette
  fois (l'accueil les rogne en `cover`). `PHOTOS` + `CARNETS_ALL` entrelacés de façon déterministe ;
  légendes conditionnelles dans `MasonryGrid` et `MediaOverlay` (les photos n'ont pas de titre).
- **Menu** : entrée `livres` ajoutée avec un flag `hidden`, filtrée au rendu (`SECTIONS_VISIBLES`).
- **Dessins de Vania exploités.** Nouveau `tools/cutout-drawing.py` : luminance → alpha, recadrage
  sur l'encre, découpe des planches en composantes connexes. Sort `assets/brand/nom-manuscrit.png`
  (signature, dans l'en-tête à droite de la maison, cliquable → Bio) et 12 sigles détourés qui
  remplacent les glyphes Unicode `⫸ ※ ▵` des titres de section. Nouvelle variable `--ink-invert`
  (`none` / `invert(1)`) : un seul fichier par dessin, inversé en thème sombre.
- **Bio complétée** depuis `JONATHAN/Bio VJM.odt` : biofilmographie intégrale (4 paragraphes au lieu
  d'un résumé) + section **Art contemporain** qui manquait. `BIO.filmo`/`BIO.art` deviennent des
  tableaux de segments `{t}` / `{t, href}` rendus par un helper `RichText` — « Écran Mobile » pointe
  vers ecran-mobile.ch, la structure accueillera les autres collaborateurs.
- Vérifié dans Chrome (localhost:8123), clair **et** sombre : menu, déroulant, aléas, Kinematik
  (survol sur photos claires et sombres), Album, Contact (palette, 6 encres, réseaux, email),
  Carnets, Bio. Zéro erreur console applicative. Build prod OK, `dist/assets/brand/` copié.

### Typographie — Cormorant × Space Grotesk → **Newsreader × Manrope**
Vania a listé 7 polices qu'elle aime (Manrope, Open Sans, Inter, EB Garamond, Dosis, Rajdhani,
Newsreader) ; Jonathan a tranché pour Newsreader (titres + corps) × Manrope (digital, chiffres, UI).
- `--heading-weight` 500 → **400** : Newsreader est plus gras que Cormorant à graisse égale.
- Corps de la Bio redescendu à `clamp(1rem, 1.4vw, 1.1rem)` : les +10 % de l'itération 2
  compensaient la faible hauteur d'x de Cormorant, Newsreader n'en a pas besoin.
- Nouvelle famille **Arsenale White** (`--font-bio`) sur l'intro de la Bio, comme dans le PDF de
  Vania, à `1.45em` de l'échelle du corps (sa hauteur d'x est très basse).

### Deux polices sous licence non commerciale
| Police | Usage | Statut |
|---|---|---|
| Learning Curve (Blue Vinyl) | aléas du jour | accord écrit à demander à bvfonts@bvfonts.com |
| **Arsenale White (Zetafonts)** | intro de la Bio | fichier **trial**, CC BY-NC → **achat** de la famille sur zetafonts.com |

Les deux bloquent la mise en ligne d'un site professionnel. Arsenale demande un achat, pas une
autorisation. À arbitrer avec Vania avant déploiement.

### À faire remonter à Vania
- `⏅` remplacé par `✈` (glyphe indisponible dans les polices du site).
- **Arsenale White n'a pas de capitales** : c'est une monocasse, « VJM » s'affiche « vjm ».
  C'est la police de son propre PDF, mais l'effet sur ses initiales mérite d'être validé.
- Graphie retenue d'après son exemple : « Montevidéo » accentué, « Opération Béton » capitalisé.
- Portrait aléatoire de la Bio : reporté, en attente du dossier « autoportraits » (Jonathan).

---

## Etat session 2026-07-26 — passe design (layout, contact, bio)

**Fait :**
- **Grammaire de layout unifiée** : tokens CSS `--container-max` (1440) / `--container-pad` / `--header-h` (78) /
  `--page-top` / `--page-bottom` / `--block-gap` dans le gabarit HTML, + composant `Page` (`default` / `prose` / `bleed`)
  dans `waniushka-components.jsx`. Les 6 wrappers inline (`maxWidth: 720/820/1080`, `110px 8vw 100px`) ont disparu.
- **En-tête classique et constant** sur toutes les pages sauf l'accueil : maison à gauche, étoile / thème / montagne
  au centre, hamburger à droite. La prop `variant` et le wordmark « Vania Jaikin Miyazaki » sont supprimés.
- **Overlay ≡ aligné sur la page Menu** : nouveau `SectionTitleButton` partagé (typo digitale + sigles), les 3 sections
  en grand + `contact · bio` en secondaire. Fond passé opaque (l'ancien 0.985 laissait transparaître la page dessous).
- **Aération** : Films (padding de ligne `clamp(30px,4vw,52px)`, titres jusqu'à 2.6rem, pleine largeur),
  AudioPlayer (lignes de piste `clamp(18px,2.2vw,28px)`), Carnets en 4 colonnes.
- **Contact en split plein écran** : formulaire à gauche (colonne de lecture 460), canvas bord à bord à droite sur
  `calc(100vh - var(--header-h))`. Empilé sous 760 px.
- **Zone dessin réécrite** : traits conservés en mémoire (`{color, pts}`) et rejoués → survit au resize (net, avec
  `devicePixelRatio`) et à la bascule de thème. Palette 6 encres (encre du thème + orange/rose/vert/jaune/bleu fluo).
- **Bio en split** : texte à gauche, portrait 3:4 sticky à droite (`assets/bio/portrait.jpg` = `autoretrato_2.jpg`,
  provisoire). `BIO.portrait` ajouté aux data.
- **Renommage** « Carnets de bord » → **« Carnets de voyage »** (3 labels ; l'id technique `carnets` est inchangé).
- **Accueil en paysage uniquement** : `home-08.jpg` (portrait, `portail cosmique.jpeg`) supprimée, 6 photos paysage
  ajoutées (home-08…13). Le pool est passé de 8 à 13, toutes vérifiées en paysage.
- Vérifié dans Chrome (localhost:8123), clair + sombre : toutes les pages, les 6 encres, la bascule de thème sur un
  dessin en cours, l'overlay ≡, les pop-up aléas/infos. Zéro erreur console applicative.

**Deux bugs corrigés en route :**
- `strokeStyle` recevait l'**id** de l'encre (`'rose'`) au lieu de sa valeur CSS → tout se dessinait en noir.
- Le redraw au changement de thème lisait `--fg` **avant** que `data-theme` soit posé sur `<html>` (les effets enfants
  passent avant ceux du parent) → trait quasi invisible. Résolu par un `requestAnimationFrame`.

**Non vérifié :** le rendu mobile (< 760 px). `resize_window` n'a pas d'effet sur cette fenêtre Chrome (maximisée) ;
les branches `isMob` sont en place mais n'ont pas été vues à l'écran.

**Reste ouvert :** portrait Bio définitif à demander à Vania ; photos d'accueil non optimisées (5 fichiers à ~700-950 ko).

### Retours Jonathan — même session
- `contact · bio` ajouté **aussi sur la page Menu** (composant `SecondaryLinks` partagé avec l'overlay ≡), et passé de 14 à 17 px.
- Collage des carnets aéré : `columnGap` 12 → 32, marge basse 10 → 40, légende `marginTop` 8 → 12
  (la rotation + le décalage du collage faisaient chevaucher l'image suivante sur la légende).
- IBAN retiré de la page Bio (il reste sur la page Contact).
- **Aléas du jour refondu** : plus de pop-up encadrée sur fond noir. Nouveau composant `AleaOverlay` —
  voile dans la couleur du site (`--bg-veil`, nouvelle variable par thème) + `backdrop-filter: blur(22px)`,
  sans cadre ni croix, la phrase se pose **mot à mot** (fondu + flou qui se dissipe + léger drift vertical,
  stagger 70 ms). Sortie jouée avant le démontage, sans décalage. Clic n'importe où ou Échap.
  Piège rencontré : avec un fond opaque + `opacity` sur l'élément, le `backdrop-filter` est recouvert et la page
  derrière reste nette → d'où la variable `--bg-veil` en rgba.

### Typographie — consolidation à 3 familles
Avant : Playfair Display + EB Garamond + Space Grotesk (+ Learning Curve = 4). Après :

| Variable | Police | Usage |
|---|---|---|
| `--font-heading` / `--font-body` | **Cormorant Garamond** | titres **et** corps — une seule serif, déclinée par graisse/taille |
| `--font-digital` | Space Grotesk | titres de section du menu + sigles |
| `--font-hand` | **Learning Curve** | uniquement les « aléas du jour » |

- Playfair Display et EB Garamond retirés (Jonathan n'aimait pas Playfair et préfère Cormorant à EB).
- `--heading-weight` 400 → 500, et le corps de la Bio remonté à `clamp(1.15rem, 1.75vw, 1.35rem)` :
  Cormorant a une hauteur d'x plus basse, à taille égale il paraît un cran plus petit.
- ⚠️ Ces valeurs sont écrites **deux fois** : dans le `:root` du gabarit HTML **et** dans `useGlobalTypo`
  (`waniushka-app.jsx`) qui les écrase au runtime. Modifier les deux.

#### Règle de lisibilité (passe post-Cormorant)
Cormorant décroche vite sous 14 px. Deux décisions, appliquées partout :
1. **Chiffres et commandes d'interface en Space Grotesk**, texte éditorial en serif — minutages du player,
   sauts ±30s/±1min, numéros d'épisode, durées, métadonnées de survol Kinematik, libellés de l'overlay aléas.
2. **Plus rien sous 13 px qui porte de l'information.** Remontés : note d'album 12→16, « À l'écoute » 11→12,
   sauts 11→13, titre en cours 20→`clamp(20,2vw,26)`, minutages 11→13, titres d'épisode
   `clamp(16,1.6vw,20)`→`clamp(18,1.7vw,23)`, retour album 13→15, labels du formulaire 12→14,
   email/IBAN contact 13→15, légendes carnets 11→13, infos album (pop-up) 15→17, légende lightbox 13→15.
   Restent volontairement à 11 px, en Space Grotesk : les deux chuchotements de l'overlay aléas.
- Corps de la Bio redescendu de 10 % à la demande : `clamp(1.05rem, 1.58vw, 1.2rem)`.

### Learning Curve — deux points à connaître
1. **Licence** : Blue Vinyl Fonts, « free to use in any private manner ». L'usage **commercial** demande
   un accord écrit de bvfonts@bvfonts.com. Le site de Vania est professionnel → **mail à envoyer avant
   la mise en ligne**. Licence conservée dans `assets/fonts/LearningCurve-LICENSE.txt`.
2. **La police n'a pas d'accent aigu** : `é á ó ú É` et le `´` isolé sont tous dessinés avec un accent
   **grave** (« emporté » se lit « emportè »). Les glyphes sont des contours simples, l'accent est fondu
   dans la lettre. Corrigé par `tools/fix-acute-accents.py`, qui isole le contour de l'accent (le plus haut
   du glyphe), le retourne horizontalement et réinverse son sens d'enroulement — 13 glyphes retouchés.
   Le site charge `LearningCurve-fr.ttf` ; l'original `LearningCurve.ttf` est conservé intact.

---

## Etat session 2026-07-16

**Fait :**
- Réécriture complète de l'app React sur la nouvelle IA des wireframes : Accueil → Menu → Kinematik / Films / Album / Carnets / Contact / Bio, + overlays (menu ≡→✕, aléas, infos album).
- Nouvelles briques dans `waniushka-components.jsx` : `MediaOverlay` (lightbox image OU Vimeo, ✕ ‹ ›), `AudioPlayer` étendu avec sauts ±30s / ±1min, icônes SVG (maison/montagne/étoile/≡), `Popup` générique, `MasonryGrid` accepte les vraies images.
- Data en dur ajoutée : `HOME_PHOTOS`, `KINEMATIK` (12 films + Vimeo), `ALBUMS` (3, avec infos + épisodes), `CARNETS` (10 images), `ALEAS`, `BIO`.
- Assets : ~8 photos d'accueil + 10 carnets copiés/renommés ASCII dans `assets/`.
- Branding `<title>` → « Vania Jaikin Miyazaki ».
- Vérifié end-to-end dans Chrome (localhost:8123) : toutes les pages + interactions OK, zéro erreur console.

**Prochain :** Décider avec Vania les items « à fournir » (sigles transparents, police arsenale white, 100 titres coquillages, sons réels) OU polir le rendu (nom manuscrit, densité collage, canvas theme-aware). Rien ne bloque : la maquette tourne.

**Pieges :**
- Preview : `file://` bloqué par l'extension Chrome → servir en HTTP (`python -m http.server 8123`).
- Build obligatoire après toute modif JSX : `node precompile.mjs`.
- Pas de dépôt git dans ce dossier → pas de commits.
- Les captures Chrome pendant les fondus (PageTransition/reveal) apparaissent blanches ~0,5 s — cosmétique, recapturer.

**Commit :** — (pas de git)

---

## Carte du code
> Mise a jour : 2026-08-08

| Fichier | Role |
|---------|------|
| `design-extract/site-minimalist-portoflio/project/waniushka-app.jsx` | IA + toutes les pages/écrans + en-tête + overlays (déroulant ≡ / aléas / infos / biofilmographie) + briques de navigation (`BackLink`, `Sigle`, `SectionTitleButton`). Point d'entrée `App`. |
| `design-extract/site-minimalist-portoflio/project/waniushka-components.jsx` | Data en dur (KINEMATIK, ALBUMS, BIO…) + briques partagées (MediaOverlay, AudioPlayer, SpotifyEmbed, MasonryGrid, Popup, `RichText`, icônes SVG + réseaux, ThemeToggle). |
| `design-extract/site-minimalist-portoflio/project/waniushka-assets.jsx` | **GÉNÉRÉ** par `tools/import-images.py` — inventaire des images (chemins, dimensions, vignettes, titres). Ne pas éditer : relancer le script. |
| `design-extract/site-minimalist-portoflio/project/Waniushka Portfolio.html` | Gabarit HTML source (title, Google Fonts, vars CSS thème dont `--ink-invert`). Plus aucun `@font-face` : les deux manuscrites ont été retirées. |
| `design-extract/site-minimalist-portoflio/project/tweaks-panel.jsx` | Ancien panneau de variantes — bundlé en dev mais **plus utilisé**. |
| `precompile.mjs` | Build : compile les JSX → `waniushka.bundle.js` + régénère `index.html`. En `--prod`, repart d'un `dist/assets` vide et exclut les polices sous licence. |
| `tools/import-images.py` | `JONATHAN/{CARNETS,Photos,Autoportraits}` → `assets/{carnets,home,bio/portraits}` + vignettes `-t` + `waniushka-assets.jsx`. **Le point d'entrée après toute livraison d'images de Vania.** |
| `tools/cutout-drawing.py` | Détoure les scans → `assets/brand/*.png` (sigles, nom manuscrit) et `assets/aleas/*.png` (les 24 phrases). Alpha depuis la luminance, découpe par composantes connexes. |
| `tools/fetch-thumbs.py` | Vignettes Kinematik depuis l'oEmbed Vimeo → `assets/kinematik/{id}.jpg`. Signale les posters restés uniformes. |
| `tools/fetch-audio.py` | Épisodes depuis les partages kDrive → MP3 mono 96 kbps dans `assets/audio/{album}/` + durées ffprobe à reporter dans `ALBUMS`. Cache brut dans `.audio-cache/`, hors build. |
| `tools/serve.py` | Preview **avec support des requêtes Range** (indispensable pour tester les sauts audio). `python tools/serve.py 8123 [dist]`. |
| `tools/fix-acute-accents.py` | Réparait les accents aigus de Learning Curve. **Sans objet** depuis que la police est retirée ; conservé pour l'archive. |
| `assets/carnets/`, `assets/home/`, `assets/bio/portraits/` | Images normalisées depuis `JONATHAN/`, deux tailles (`nom.jpg` + `nom-t.jpg`). `HOME_PHOTOS` filtre les paysages **au runtime**, sur les dimensions réelles. |
| `assets/aleas/`, `assets/brand/` | Manuscrit de Vania : encre noire sur transparent, inversée en sombre via `--ink-invert`. |
| `assets/kinematik/`, `assets/audio/` | Vignettes de films et épisodes sonores. |

### Decisions cles
- MVP prototype : data en dur, contenu partiel, on reconstruira propre depuis zéro une fois la maquette validée.
- 3 sections uniquement (Kinematik/Films/Carnets), fidèle au wireframe Menu. Photos « 1/60e » et Fragments écartés.
- Zone dessin = petit canvas maison (pas Excalidraw).
- Icônes = placeholders SVG (les sigles `.jpeg` de Vania ont un fond blanc → inutilisables tels quels).
- Player audio simulé (sons kdrive non fournis).

---

## Tâches

### Structure & pages (FAIT)
- [x] Accueil : photo aléatoire plein écran + maison centrée → menu
- [x] Menu : nom manuscrit HG (→Bio), 3 titres digitaux + sigles `⫸ ※ ▵`, étoile/lune-soleil/montagne HD
- [x] En-tête pages internes : maison / ≡→✕ / étoile / thème / montagne
- [x] Menu overlay (Kinematik/Films/Carnets/Contact/Bio)
- [x] Kinematik : grille désalignée, hover métadonnées, lightbox Vimeo ✕ ‹ ›
- [x] Films : 3 albums + « i » infos pop-up
- [x] Album : player + sauts ±30s / ±1min + liste épisodes
- [x] Carnets de voyage : collage penché + lightbox image ✕ ‹ ›
- [x] Contact : form + canvas dessin + email + IBAN
- [x] Bio : texte intro + biofilmographie
- [x] Mode sombre (lune-soleil) + pop-up aléas du jour (étoile)

### Reste à faire — assets/contenu à fournir par Vania
- [x] Sigles manuscrits transparents — **plus besoin de PNG fournis** : `tools/cutout-drawing.py`
      détoure ses scans (nom VJM_3 + 12 sigles + les 2 caméras). Maison/lune/soleil/montagne
      restent en SVG (nets à 22 px).
- [ ] Un « i » différent par album (`JONATHAN/Sigles/sigles_infos.jpeg`, détourable par le même outil)
- [x] ~~Police arsenale white~~ — **retirée** le 2026-08-08 (bio en Newsreader). Licence sans objet.
- [x] Dossier « autoportraits pour bio » → portrait aléatoire parmi 15 (2026-08-08)
- [x] Contenu réel des « aléas du quotidien » — 24 phrases manuscrites détourées (2026-08-08)
- [ ] 100 titres d'épisodes de « L'apparition des coquillages » — en attendant, l'album affiche
      l'embed Spotify officiel, qui donne les 100 épisodes réels
- [x] Fichiers audio réels (kdrive) → MP3 en ligne, player réel (2026-08-08)
- [ ] Vrais titres des **2** épisodes de « Mourir c'est pas si grave » (les masters ne disent
      que « Episode #1 / #2 ») → tâche @jon
- [ ] Contenu de la section **livres** (entrée de menu déjà câblée, masquée par `hidden: true`)
- [ ] Photos/références dans les pop-up infos (idée mail 2)

### Reste à faire — polish / décisions
- [x] Rendu « manuscrit » du nom (fait le 2026-07-30 : scan détouré dans l'en-tête, 46 px)
- [x] Canvas dessin theme-aware (fait le 2026-07-26 : traits rejoués, l'encre suit `--fg`)
- [x] Vignettes Kinematik en collage + formats variés + trailers signalés (2026-08-08)
- [ ] **Autoriser l'embed des 12 vidéos sur le domaine de production** (Vimeo répond 401
      partout aujourd'hui) → bloquant pour la page Kinematik, tâche @jon
- [ ] Poster Vimeo de `k4` (Opération Béton) : image noire → tâche @jon
- [ ] Icône maison de l'accueil plus lisible (blanche, discrète sur photo claire)
- [ ] Compléter Kinematik (12/22 films saisis) + vérifier durées/années
- [ ] Rendu mobile (< 760 px) toujours pas vu à l'écran
- [ ] Arbitrer les ~98 Mo d'audio hébergés sur le site → tâche @jon
- [ ] Confirmer : garder 3 sections ou réintégrer Photos « 1/60e de seconde » + Fragments
- [ ] Domaine — **`vjmvjmvjm.com`** et non `vvvjjjmmm.com` (déploiement, plus tard)

## Contexte
Itération 2 = mettre en réel, en maquette MVP fidèle, les wireframes manuscrits de Vania (dossier `JONATHAN/`).
Voir le message complet de la cliente conservé dans `docs/PLAN.md`.
