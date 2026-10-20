# Feature — Migration vers Astro (site propre v1)

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

## Etat session 2026-10-20

**Fait :**
- plan de migration complet (ce fichier) ; rien de codé côté Astro ;
- contenu vérifié : `content` == `main`, site en ligne identique au repo (§2) ;
- semis du menu (`DotField`) : houle lente au repos, suivi doux de la souris sans rotation — commité sur `main`, **pas poussé**.

**Prochain :** Phase 0 du §5 — créer la branche `astro` depuis `main`, installer Astro + `@astrojs/react` + `@astrojs/sitemap`, brancher les collections sur `content/`. Trancher d'abord le slug des films Kinematik (§3).
**Pieges :** ne pas toucher au test de Vania sur k1 (« coucou ici c'est charles ») ; vérifier les deploy previews Netlify avant de pousser `astro` (tâche Jon) ; réglages du semis à valider à l'œil (`SHIFT`, `SPRING`, `DAMP`, `WAVE_AMP`, `WAVE_SPEED`).
**Commit :** e7b029f feat: soft wave at rest and gentle cursor follow for the menu dot field

---

## Carte du code
> Mise a jour : 2026-10-20

| Fichier | Role |
|---------|------|
| `design-extract/site-minimalist-portoflio/project/waniushka-app.jsx` | toutes les pages, `App` (navigation par état, sans URL), `DotField`, contact — à éclater en pages `.astro` + îles |
| `design-extract/site-minimalist-portoflio/project/waniushka-components.jsx` | lit `window.CONTENT` au niveau module ; `Popup`, `MediaOverlay`, `MasonryGrid`, `AudioPlayer`, `Blocks` — à passer en props |
| `design-extract/site-minimalist-portoflio/project/Waniushka Portfolio.html` | gabarit : `:root`, SEO, JSON-LD, copie statique du formulaire Netlify |
| `precompile.mjs` | Babel + injection contenu/SEO + copie `dist/` — disparaît |
| `tools/build-content.mjs` | Markdown → HTML, lecteurs playlist/vidéo — logique à reprendre dans `src/lib/content.ts` |
| `tools/build-images.mjs` | dimensions, variantes, vignettes, purge `public/assets/_gen/` ; lancé seul, écrit `src/generated/images.json` |
| `public/admin/config.yml` | schémas Sveltia, source des schémas zod |
| `src/content.config.ts` | collections + loader `json()` strict + unicité des URL Kinematik |
| `astro.config.mjs` | site, sortie statique, react + sitemap |
| `tests/site.test.mjs` | 33 tests, surtout des regex sur la source JSX — à réécrire sur `dist/` |

### Decisions cles
- Même repo, branche `astro` ; `content/` ne change pas de forme pendant la migration.
- Pipeline d'images sharp conservé plutôt que `astro:assets` (pas de migration des chemins du CMS).
- Slug Kinematik : champ `slug` facultatif, repli sur `id` (seule exception à « `content/` ne change pas »).
- Loader `json()` maison plutôt que `file` d'Astro, qui laisse passer une collection vide.

---

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
| `ClientRouter` (View Transitions) + `transition:persist` sur le lecteur audio et l'en-tête | Aujourd'hui l'audio continue quand on change de page ; en MPA il se couperait | Rechargement complet (perd l'audio et les fondus) |

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

- **Audio coupé en navigation** si `transition:persist` mal posé — à tester tôt (phase 2.1).
- **Doublons de tokens CSS** (`:root` du gabarit + `useGlobalTypo`) : en fusionnant, vérifier que rien ne change visuellement (captures avant/après).
- **Builds Netlify** : chaque déploiement compte sur le plan Free ; les previews de la branche aussi. Vérifier le réglage des deploy previews avant de pousser `astro`.
- **Modif CMS pendant la migration** sur un champ que les schémas zod refusent → le build de la branche casse ; c'est voulu (on le voit avant la bascule).
- **117 pages carnets** : poids du build et du sitemap (exclues du sitemap car noindex).
