# Feature — Migration vers Astro (site propre v1)

> **Statut** : EN COURS (code fini, recette et bascule à faire par Jonathan) · **Livré** : 2026-10-20 sur la branche `astro`, non fusionnée · **Commits** : Phase 0 `2242955..da76276`, Phases 1 à 4.2 et 4.5 `a797882..ff75e3b`

## Ce que ça fait
Le site de Vania passe d'une application React mono-page (une seule URL, tout rendu en JS) à un site Astro statique : une vraie page HTML par contenu (film, album, texte, carnet, bio FR/EN, contact), avec title, description, canonical, Open Graph, JSON-LD, hreflang et sitemap générés. Les visiteurs et Google obtiennent des URL partageables, et le bouton retour reste dans le site. Vania continue d'éditer dans le CMS Sveltia, `content/` n'a pas changé de forme (sauf le champ facultatif `slug` des films).

## Comment ça marche
```
content/*.json ─► src/content.config.ts (9 collections, loader json() strict, schémas zod)
                       │
public/assets ─► tools/build-images.mjs ─► src/generated/images.json (manifeste) + public/assets/_gen/
                       │                         │
                       ▼                         ▼
        src/pages/*.astro (getStaticPaths)  ◄─ src/lib/{content,images,carnets,seo}.ts
                       │   Base.astro : head SEO, JSON-LD, thème, ClientRouter
                       ▼
        astro build (format "file") ─► dist/*.html + sitemap-index.xml ─► tools/optimize-dist.py (audio 48k)
```
1. **Build** (`npm run build`) : `import-vector-sigles.py`, `build-images.mjs` (manifeste + variantes), `astro build`, `optimize-dist.py`. Une collection invalide (type faux, JSON cassé, slug Kinematik ou carnet en double) arrête le build avec le fichier en cause.
2. **Pages** : `src/pages/` donne les URL du plan §3 (`/`, `/menu`, `/kinematik`, `/kinematik/{slug}`, `/films`, `/films/{id}`, `/carnets`, `/carnets/{slug}`, `/lecture`, `/lecture/{id}`, `/bio`, `/en/bio`, `/contact`, 404). 143 pages au dernier build.
3. **URL sans slash final** : `build.format: "file"` produit `menu.html`, donc canoniques, liens internes et sitemap sont tous sans `/` final. Le service Netlify de ces « pretty URLs » (`/menu` vers `menu.html`, et `kinematik.html` à côté du dossier `kinematik/`) reste à vérifier sur une deploy preview.
4. **Slug Kinematik** : `slug` du CMS, sinon `id`. **Slug carnet** : nom de fichier sans extension ; en cas de collision (`boule-disco`, `bourgeois`, `la-soupe` existent dans `carnets/` et `home/`), le second prend `{dossier}-{nom}` (ex. `home-boule-disco`) ; si cela collisionne encore, le build s'arrête (`src/lib/carnets.ts`). 117 tuiles, comme l'ancien site.
5. **Navigation** : `ClientRouter` (View Transitions). L'en-tête et le thème sont persistés ; le thème (`localStorage` `vjm-theme`) est appliqué par un script inline avant le rendu et après chaque échange. Le lecteur audio **n'est pas persisté** : l'ancien `AudioPlayer` était monté dans `AlbumPage` et se coupait au démontage, la parité l'emporte (le §1 et le §6 du plan d'origine, plus bas, affirmaient le contraire à tort).
6. **Lightbox en pages** (`Lightbox.astro`, `kinematik/[slug]`, `carnets/[id]`) : ‹ › naviguent en `replace`, ✕ revient en arrière si la lightbox a été ouverte pendant la visite (lit `history.state.index` du routeur), sinon va à la page parente. `/carnets/{slug}` est `noindex`, canonical vers `/carnets`, absent du sitemap.
7. **Pop-ups sans URL** (aléa, news, « i » d'album, œil de la bio, menu ≡) : `src/scripts/popups.ts` + `src/lib/popup-history.ts` poussent une entrée d'historique à l'ouverture ; le retour la ferme. `Base.astro` pose avant le routeur un écouteur `popstate` qui appelle `window.__vjmPopstate`, pour que la pop-up passe avant le routeur.
8. **Aléatoire et annonces** : photo d'accueil, portrait de bio, aléa du jour et fenêtre de dates des news sont résolus côté navigateur (`src/lib/news.ts`, partagé build/client) ; le HTML statique porte une valeur par défaut.
9. **SEO** : `src/lib/seo.ts` (`describe`, `isoDuration`, `itemList`, `person`) ; `Base.astro` émet meta, OG, hreflang et JSON-LD. Sitemap : `@astrojs/sitemap` avec un filtre qui exclut `/carnets/*` et `/404`.
10. **Contact** : `contact.astro` contient le vrai `<form name="contact" data-netlify="true">` (mêmes champs que l'ancien) et le canvas de dessin.

## Carte du code
> Mise à jour : 2026-10-20

| Fichier | Rôle |
|---|---|
| `astro.config.mjs` | `site`, sortie statique, `build.format: "file"`, react + sitemap (filtre carnets/404) |
| `src/content.config.ts` | 9 collections sur `content/`, loader `json()` strict, unicité des URL Kinematik |
| `public/admin/config.yml` | schémas Sveltia, source des schémas zod |
| `tools/build-images.mjs` | dimensions, variantes, vignettes, purge `public/assets/_gen/`, écrit `src/generated/images.json` |
| `tools/optimize-dist.py` | audio 48k dans `dist/` après `astro build` |
| `src/layouts/Base.astro` | head SEO, JSON-LD, hreflang, polices, script de thème, relais popstate, `ClientRouter` |
| `src/components/Page.astro`, `Header.astro`, `Lightbox.astro`, `Popup.astro`, `BioPage.astro` | gabarit de page, en-tête persisté, lightbox, pop-ups (templates), bio FR/EN |
| `src/pages/**` | une page par URL du plan, `getStaticPaths` sur les collections |
| `src/islands/AudioPlayer.jsx`, `Playlists.jsx` | lecteur d'album (non persisté) et lecteurs de playlist |
| `src/islands/DotField.jsx`, `MenuDropdown.jsx` | semis du menu, menu ≡ |
| `src/lib/content.ts` | Markdown, lecteurs playlist/vidéo, images Markdown via le manifeste (ex `tools/build-content.mjs`) |
| `src/lib/carnets.ts` | liste ordonnée des carnets, slugs et règle de collision |
| `src/lib/seo.ts`, `images.ts`, `news.ts`, `random.ts`, `sigles.ts` | SEO, accès au manifeste, fenêtre des news, aléa déterministe, sigles |
| `src/lib/popup-history.ts`, `src/scripts/popups.ts` | pile d'historique et ouverture des pop-ups |
| `src/styles/global.css`, `menu-dropdown.css` | tokens fusionnés, styles du menu |
| `tests/site.test.mjs`, `popup-history.test.mjs`, `news.test.mjs` | 36 tests, ceux sur les pages lisent `dist/` |

### Décisions clés
- Même repo, branche `astro`, `content/` inchangé hors `slug` Kinematik (détail daté → DECISIONS.md).
- Pipeline d'images sharp conservé plutôt que `astro:assets`.
- `build.format: "file"` plutôt que `trailingSlash: "always"` — évite de réécrire tous les liens internes.
- Lecteur audio non persisté entre pages — parité avec l'ancien site.
- Slug carnet en collision : `{dossier}-{nom}` — URL stable, ordre inchangé.
- Ancien pipeline supprimé (`precompile.mjs`, `tools/build-content.mjs`, `design-extract/`, `build.py`, `tools/fetch-thumbs.py`, `tools/package-netlify.py`, Babel) ; l'historique git le garde.

## Comment débuguer
- **Par où entrer** : `npm run build`, puis `dist/{page}.html` ; en dev `npm run dev` (ne recharge pas un JSON de `content/` modifié : relancer). Pop-ups : `src/lib/popup-history.ts`. Lightbox : le `<script>` de `Lightbox.astro`.
- **Ce qu'on observe** : `dist/sitemap-index.xml`, canonical et JSON-LD de chaque page, `src/generated/images.json`, `npm test` (les tests de pages lisent `dist/`).
- **Pannes connues** : build qui s'arrête avec un nom de fichier → JSON refusé par le schéma zod ou slug en double (corriger dans le CMS) · tests « skipped » → `dist/` absent, lancer `npm run build` · image absente d'une grille carnets → absente du manifeste (`carnets.ts` l'écarte sans avertir).
- **Pièges** : un script de composant ne tourne qu'une fois sous `ClientRouter` (délégation sur `document`) · le thème est réappliqué sur `astro:after-swap` · la fermeture de lightbox dépend de `history.state.index`, interne à Astro (un test le surveille) · pas de `stopPropagation` dans le menu (cause de rechargements complets) · un fichier déposé par le CMS dans l'ancien `assets/` pendant la migration est à déplacer dans `public/assets/` à la fusion.

## Configuration
Aucune variable d'env. Node `>=22.22.0` (champ `engines` de `package.json`, `NODE_VERSION` de `netlify.toml`), Python 3.13 pour les scripts de build. Formulaire Netlify `contact` (nom conservé). `.github/workflows/publier.yml` inchangé.

## Tests et vérifications
| Vérif | Commande | Résultat réel |
|---|---|---|
| Build complet | `npm run build` | relancé 2026-10-20 : OK, 143 pages |
| Tests | `npm test` | relancé après build : 36 pass, 0 fail, 0 skipped |
| Tests sans `dist/` | `npm test` | les tests de pages sont ignorés (skipped) |
| Navigation, lightbox, pop-ups en navigateur | Chrome headless (tâches 5 à 7) | rapporté, non relancé |
| Recette visuelle (4.1) | manuelle | non faite |
| Pretty URLs Netlify, envoi réel du formulaire, Lighthouse, validateur Schema.org | deploy preview | non faits |

## Limites et dettes
- **À faire (Jonathan, déjà dans `cerveau/10-Projets/wania/wania-human.md`)** : 4.1 recette visuelle (clair/sombre, mobile, tactile, audio, CMS), 4.3 fusion dans `main` (`git merge main` d'abord), 4.4 Search Console (soumettre `sitemap-index.xml`), vérifier une deploy preview Netlify.
- Écarts au plan : audio non persisté (voir ci-dessus) ; `tools/fetch-thumbs.py` supprimé, donc plus de récupération automatique des posters Vimeo pour un nouveau film.
- `describe()` (`seo.ts`) : coupe toujours le dernier mot, peut dépasser 160 caractères, retire `_` et `*` dans les mots ; `Person` répété au lieu d'une référence `@id` ; les `PodcastEpisode` d'un album partagent la même `url`.
- Mineurs reportés : `/bio` écrit toujours `vjm-bio-lang` (remet en FR) ; thème sombre perdu à la navigation si `localStorage` lève ; tuile Kinematik qui pivote au survol sous 760 px ; `seededRandom` dupliqué dans `DotField.jsx` ; menu ≡ inerte avant hydratation ; pas de test pour la branche « page identique, href différent » de `popup-history` ; `requestClose(then)` perd `then` pendant une fermeture.
- Les fiches `iteration-5`, `iteration-6`, `iteration-7` et `maquette-iteration-2` décrivent l'ancien pipeline : toute référence à `precompile.mjs`, `tools/build-content.mjs`, `design-extract/`, `window.CONTENT` ou Babel y est historique. Fichiers racine ignorés encore présents : `index.html`, `waniushka.bundle.js`, `waniushka-netlify-rc5.zip`, `design.tar.gz`.

---

## Etat session 2026-10-20 (Phase 0)

**Fait :** Phase 0 sur la branche `astro`.
- Astro 7.4.1 + `@astrojs/react` 7.1 + `@astrojs/sitemap` 3.7 + React 19.3 ; `astro.config.mjs`, `tsconfig.json`.
- `assets/` → `public/assets/`, `admin/` → `public/admin/` ; chemins des scripts Python et des tests suivis. CMS : `media_folder: public/assets` (les valeurs JSON restent `assets/…`).
- Slug Kinematik tranché (option B) : champ `slug` facultatif dans le CMS (motif `a-z0-9-`), URL = `/kinematik/{slug || id}`, deux films à la même adresse arrêtent le build.
- `src/content.config.ts` : 9 collections sur `content/`, schémas zod miroir de `config.yml`. Loader `json()` maison : celui d'Astro (`file`) journalise un JSON illisible ou un doublon et continue avec une collection **vide**. Vérifié : type faux, JSON cassé, slug en double, carnet en double, texte de lecture cassé → le build s'arrête avec le fichier en cause.
- Manifeste d'images : `node tools/build-images.mjs` écrit `src/generated/images.json` (chemin du CMS → `{src, w, h, thumb?}`, 168 images), variantes dans `public/assets/_gen/`.
- Polices d'archive (licences non commerciales, `ArsenaleWhite-trial`) sorties de `public/` vers `archive/fonts/` : `precompile.mjs` les excluait, Astro aurait tout publié.
- `npm run build` complet OK (0 page, normal), 33 tests verts.

**Prochain :** Phase 1.1 — `Base.astro`, `global.css` (tokens fusionnés), Header, police du menu.
**Pièges :** `precompile.mjs` ne tourne plus sur cette branche (référence pour le portage, supprimé en Phase 4) · la vignette Kinematik par défaut est `assets/kinematik/{id}.jpg` (logique dans `resolveImages`, à reproduire côté page) · `astro dev` ne recharge pas un JSON de `content/` modifié : relancer · à la fusion finale, un fichier déposé par le CMS dans `assets/` (ancien chemin) pendant la migration doit être déplacé dans `public/assets/`.
**Commit :** da76276 feat: Astro foundation with strict content collections and an image manifest

---

## Etat session 2026-10-20

**Fait :**
- plan de migration complet (ce fichier) ; rien de codé côté Astro ;
- contenu vérifié : `content` == `main`, site en ligne identique au repo (§2) ;
- semis du menu (`DotField`) : houle lente au repos, suivi doux de la souris sans rotation — commité sur `main`, **pas poussé**.

**Prochain :** Phase 0 du §5 — créer la branche `astro` depuis `main`, installer Astro + `@astrojs/react` + `@astrojs/sitemap`, brancher les collections sur `content/`. Trancher d'abord le slug des films Kinematik (§3).
**Pieges :** ne pas toucher au test de Vania sur k1 (« coucou ici c'est charles ») ; vérifier les deploy previews Netlify avant de pousser `astro` (tâche Jon) ; réglages du semis à valider à l'œil (`SHIFT`, `SPRING`, `DAMP`, `WAVE_AMP`, `WAVE_SPEED`).
**Commit :** e7b029f feat: soft wave at rest and gentle cursor follow for the menu dot field

---

---

## Plan d'origine (référence historique ; le code fait foi)

Objectif : passer du site React mono-page (une seule URL, tout rendu en JS) à un site Astro
statique, **une vraie page HTML par contenu**, SEO propre de A à Z. Le CMS (Sveltia) et le
contenu restent identiques pour Vania.

---

## 1. Décisions

| Décision | Pourquoi | Écarté |
|---|---|---|
| Astro, sortie **statique** (`output: 'static'`), hébergé sur Netlify comme aujourd'hui | Le site est du contenu ; quelques îles interactives suffisent | Garder React + préréndu (bricolage), SSR (inutile) |
| **Même repo, branche `astro`**, fusion dans `main` au basculement | Netlify, OAuth CMS, workflow `publier.yml`, invitation de Vania et historique de `content/` sont tous liés à `jonathanvouilloz/vjmvjmvjm` | Nouveau repo : tout re-câbler (Netlify, OAuth, Action, accès Vania) pour rien |
| **`content/` ne change pas de forme** (mêmes fichiers, mêmes champs, mêmes valeurs) | Vania peut continuer d'éditer pendant la migration ; la fusion finale est triviale | Profiter de la migration pour remodeler le contenu |
| Les chemins d'image restent `assets/…` dans les JSON ; un helper les rend absolus (`/assets/…`) au rendu | En multi-pages, un chemin relatif casse dès `/films/x` ; on ne réécrit pas le contenu | Réécrire toutes les valeurs du CMS |
| Pipeline d'images existant (`tools/build-images.mjs`, sharp) conservé | Il marche déjà avec des chemins texte venus du CMS, purge et vignettes comprises | `astro:assets` (impose des chemins relatifs au fichier JSON → migration de contenu) |
| Composants interactifs repris en **îles React** (`@astrojs/react`), le reste en `.astro` | Moins de réécriture, comportements tactiles déjà débogués conservés | Tout réécrire en vanilla d'emblée |
| `ClientRouter` (View Transitions) + `transition:persist` sur l'en-tête | Fondus et en-tête stable. **Correction** : le lecteur audio n'est pas persisté, l'ancien `AudioPlayer` vivait dans `AlbumPage` et se coupait au démontage (parité) | Rechargement complet (perd les fondus) |

## 2. État vérifié avant migration (2026-10-20)

- **Contenu à jour, rien à récupérer.** `git fetch` : `origin/content` == `origin/main` == `main`
  local, aucune modification CMS en attente.
- **Le site en ligne = le repo.** `window.CONTENT` du bundle de vjmvjmvjm.com comparé clé par
  clé au build local (`site`, `bio`, `kinematik`, `albums`, `news`, `lecture`, `images`) :
  identique.
- **Ce que Vania a fait dans le CMS :** un seul commit (2026-10-05, `2736a92`), un test —
  `information: "coucou ici c'est charles"` sur le film `k1`. **Ne pas y toucher** (décision
  de Jon, 2026-10-20) : c'est son contenu. Deux commits CMS de Jon sur `site.json` le même jour.
- **Hors git, à ne pas perdre :**
  - soumissions du formulaire `contact` → Netlify Forms (dashboard Netlify). Restent si le
    site Netlify et le nom de formulaire `contact` sont conservés ;
  - réglages Netlify (OAuth GitHub pas encore activé, « production branch only ») ;
  - masters audio dans `.audio-cache/` (605 Mo, local, ignoré par git).
- **Bloqueurs externes inchangés** (voir `cerveau/10-Projets/wania/wania-human.md`) : embed
  Vimeo 401, playlists manquantes, OAuth CMS. Ils n'empêchent pas la migration.

## 3. Plan d'URL

| Page | URL | Indexée | Schéma |
|---|---|---|---|
| Accueil (photo au hasard) | `/` | oui | `Person` + `WebSite` |
| Menu | `/menu` | oui | `BreadcrumbList` |
| Kinematik | `/kinematik` | oui | `ItemList` |
| Un film (lightbox) | `/kinematik/{slug}` | oui | `VideoObject` |
| Films pour les oreilles | `/films` | oui | `ItemList` |
| Un album | `/films/{albumId}` | oui | `PodcastSeries` + `PodcastEpisode` |
| Carnets de voyage | `/carnets` | oui | `ImageGallery` |
| Une image des carnets | `/carnets/{id}` | **noindex**, canonical → `/carnets` | — (contenu trop mince) |
| Coin lecture | `/lecture` | oui | `ItemList` |
| Un texte | `/lecture/{id}` | oui | `Article` |
| Bio FR / EN | `/bio`, `/en/bio` | oui, `hreflang` croisés | `Person` / `ProfilePage` |
| Contact (dessin + formulaire) | `/contact` | oui | `ContactPage` |
| 404 | `/404` | non | — |

- Slugs : `id` du contenu quand il existe (`k1`, album `id`, texte `id`). Pour Kinematik, un
  slug lisible tiré du titre serait meilleur (`/kinematik/charles-lloyd-dreamer-in-sound`) mais
  **il ne doit pas bouger si Vania renomme le film** → à trancher au kickoff : `id` (stable,
  moche) ou champ `slug` optionnel ajouté au CMS (seule exception à « `content/` ne change pas »).
- Carnets : l'id actuel est le chemin de l'image (piège itération 7) → slug = nom de fichier
  sans extension, collisions détectées au build (erreur explicite).
- Pop-ups sans contenu propre (aléa du jour, news, menu ≡, « i » d'album, l'autre bio) : pas
  d'URL, mais le bouton retour les ferme (`history.pushState` à l'ouverture, `popstate` → ferme).

## 4. Architecture cible

```
astro.config.mjs        site: https://vjmvjmvjm.com, integrations react + sitemap
src/content.config.ts   collections → lisent ../content/*.json (loaders file/glob), schémas zod = miroir de admin/config.yml
src/lib/content.ts      rendu Markdown + lecteurs playlist/vidéo (logique reprise de tools/build-content.mjs), helper asset()
src/lib/images.ts       lit le manifeste produit par tools/build-images.mjs (dimensions, vignettes)
src/layouts/Base.astro  <head> SEO (title, description, canonical, og:*, JSON-LD), thème, polices, ClientRouter
src/components/*.astro  Header, Sigle, PageTitle, BackLink, Blocks, MasonryGrid (statique)…
src/islands/*.jsx       DotField, MediaOverlay, AudioPlayer, DrawCanvas+ContactForm, ThemeToggle, Popups, KinTile (survol/tactile)
src/pages/…             une page par ligne du §3, getStaticPaths sur les collections
src/styles/global.css   :root unique (fin du doublon gabarit HTML / useGlobalTypo)
public/admin/           Sveltia (config.yml, index.html)
public/assets/          ex-assets/ (media_folder du CMS)
```

Points structurants :
- **Les composants lisent `window.CONTENT` au niveau module** (`waniushka-components.jsx:28`,
  `KINEMATIK`, `ALBUMS`…). En îles, ils reçoivent leurs données **en props**. C'est le gros
  du travail de reprise.
- **Thème clair/sombre** : aujourd'hui un état React perdu au rechargement. En multi-pages il
  doit être **persisté** (`localStorage`, try/catch) et appliqué par un script inline dans
  `<head>` avant le rendu, sinon flash blanc à chaque page.
- **Aléatoire** (photo d'accueil, portrait de bio, aléa du jour) : choisi **côté client** par un
  petit script, sinon le HTML statique fige le même tirage pour tout le monde jusqu'au build
  suivant. Le HTML porte une valeur par défaut pour Google.
- **Formulaire contact** : la copie statique cachée du gabarit actuel devient inutile, le vrai
  `<form name="contact" data-netlify="true">` est dans le HTML. Garder exactement le même nom
  et les mêmes champs (soumissions existantes). Limite 8 Mo par requête (dessin) conservée.
- **CMS** : `media_folder: public/assets`, `public_folder: assets` (valeurs JSON inchangées).
  Tout le reste de `config.yml` identique.
- **Build** : `python tools/import-vector-sigles.py && node tools/build-images.mjs && astro build && python tools/optimize-dist.py`.
  `netlify.toml`, `publier.yml` : inchangés (vérifier que `optimize-dist.py` trouve bien
  `dist/assets/`).

## 5. Phases (une session ou plus chacune, commit à chaque étape)

### Phase 0 — Socle
1. Branche `astro` depuis `main`.
2. Astro (dernière stable au kickoff) + `@astrojs/react` + `@astrojs/sitemap` ; `assets/` → `public/assets/`, `admin/` → `public/admin/`.
3. Collections branchées sur `content/` avec schémas zod ; le build échoue clairement si un JSON ne colle pas.
4. Manifeste d'images (`build-images.mjs` adapté pour écrire un JSON lu par Astro).
5. `doc-keeper` mode init si `docs/` doit être restructuré.

### Phase 1 — Pages statiques
1. Layout de base, `global.css` (tokens fusionnés), Header, polices (police du menu depuis `site.json`).
2. Bio FR/EN, Coin lecture + textes (Markdown, notes, vidéos inline), Films + albums (playlists).
3. Kinematik et Carnets en grilles statiques (sans lightbox).
4. Accueil + Menu (titres, sigles, `DotField` en île — la version du 2026-10-20 se reporte telle quelle).

### Phase 2 — Îles et navigation
1. `ClientRouter`, fondus, `transition:persist` du lecteur audio et de l'en-tête ; `DotField` réinitialisé sur `astro:page-load`.
2. Lightbox en pages (`/kinematik/{slug}`, `/carnets/{id}`) : ‹ › en `navigate(url, { history: 'replace' })`, ✕ = retour si ouverte dans la visite, sinon page parente.
3. Pop-ups éphémères avec fermeture au bouton retour.
4. Contact : canvas de dessin + Netlify Forms (test d'envoi réel sur la preview).
5. Thème persistant sans flash ; tirages aléatoires côté client.

### Phase 3 — SEO
1. Title/description/canonical/og:image par page (description tirée de `information`, `resume`, `extrait`, `contexte` ; repli sur `site.description`).
2. JSON-LD du §3, `hreflang` FR/EN, `robots.txt`, sitemap généré (le `public/sitemap.xml` manuel disparaît).
3. Contrôle : HTML de chaque page lisible sans JS, validateur Schema.org, Lighthouse.

### Phase 4 — Parité, bascule, ménage
1. Recette page par page contre le site actuel : clair/sombre, mobile, tactile (pièges `pointerType === 'mouse'` et `:focus-visible` de `KinTile`), audio (Range, saut ±30 s / +1 min, enchaînement), Spotify, CMS (édition → `content` → publication → build).
2. Tests réécrits sur `dist/` : chaque URL du sitemap existe, meta et JSON-LD présents, pas de lien relatif cassé ; tests de contenu conservés.
3. `git merge main` dans `astro` (récupère les modifs CMS faites entre-temps), puis fusion dans `main` = un seul déploiement.
4. Search Console : soumettre le nouveau sitemap.
5. Supprimer l'ancien pipeline : `design-extract/` (le garder en archive ?), `precompile.mjs`, `tools/build-content.mjs` une fois sa logique reprise, `tweaks-panel.jsx`, `tools/package-netlify.py`, fichiers racine ignorés (`index.html`, bundle, zip, `design.tar.gz`).

## 6. Risques

- ~~Audio coupé en navigation~~ : sans objet, l'audio ne continuait pas non plus dans l'ancien site (voir « Comment ça marche » 5).
- **Doublons de tokens CSS** (`:root` du gabarit + `useGlobalTypo`) : en fusionnant, vérifier que rien ne change visuellement (captures avant/après).
- **Builds Netlify** : chaque déploiement compte sur le plan Free ; les previews de la branche aussi. Vérifier le réglage des deploy previews avant de pousser `astro`.
- **Modif CMS pendant la migration** sur un champ que les schémas zod refusent → le build de la branche casse ; c'est voulu (on le voit avant la bascule).
- **117 pages carnets** : poids du build et du sitemap (exclues du sitemap car noindex).
