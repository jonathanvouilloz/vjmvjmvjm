# PLAN — Portfolio Vania Jaikin Miyazaki (ex-Waniushka)

## Epics

| Epic | Statut | Fichier |
|------|--------|---------|
| Itération 1 — prototype d'exploration (variantes/tweaks) | DONE (archivé) | — |
| Itération 2 → 4 — maquette MVP fidèle aux wireframes | DONE | docs/features/maquette-iteration-2.md |
| Itération 5 — contenu éditable + Coin lecture + news + bio FR/EN | DONE (CMS à activer) | docs/features/iteration-5-contenu-editable.md |
| Itération 6 — schémas CMS figés (playlists, textes riches, vignettes, « i » Kinematik) | DONE | docs/features/iteration-6-schemas-cms.md |
| Site propre v1 — migration Astro (une URL par contenu, SEO) | EN COURS (plan prêt) | docs/features/migration-astro.md |

## Cadre itération 2
- Objectif : mettre en réel, en **maquette MVP**, ce que Vania a dessiné (wireframes dossier `JONATHAN/`).
- Rester simple : data en dur dans les fichiers, contenu partiel, pipeline existant (React UMD + `precompile.mjs`).
- Une fois la maquette validée par la cliente → reconstruire un site propre depuis zéro (poser `docs/` complet à ce moment).
- Décisions actées : 3 sections (Kinematik/Films/Carnets) ; zone dessin = canvas maison.
- Renommage (2026-07-26) : la section s'appelle **« Carnets de voyage »**, plus « Carnets de bord ».
  Le message client ci-dessous dit encore « de bord » — c'est une citation d'archive, ne pas la réécrire.

## Build & preview
- Build : `node precompile.mjs` (travail) / `node precompile.mjs --prod` (→ `dist/`)
- Preview : `python tools/serve.py 8123` puis `http://localhost:8123/index.html`
  (⚠ **pas** `python -m http.server`, qui ignore les requêtes `Range` : chaque saut audio ramène la lecture à zéro. `file://` reste bloqué par l'extension Chrome.)
- Preview de `dist/` : `python tools/serve.py 8124 dist`
- Déploiement : push sur `main` → Netlify lance `npm run build` et publie `dist/` (`netlify.toml`). Le CMS (`/admin/`) commite sur `main` lui aussi.
- Images : listées dans `content/` (CMS) ; le build les prépare (`tools/build-images.mjs` → `assets/_gen/`). Import en masse depuis `JONATHAN/` : `python tools/import-images.py`, puis rebuild
- Tests : `npm test`
- Blocages hors code (Vimeo 401, poster noir, titres, poids de `dist/`) → `cerveau/10-Projets/wania/wania-human.md`

---

## Historique — message client (Vania) qui cadre l'itération 2

> **Décisions finales (avec wireframes) :**
> - Accueil : photo aléatoire + maison (Home) au milieu → page Menu.
> - Menu : nom manuscrit (VJM) en haut-gauche (uniquement sur cette page ; ailleurs = maison) → Bio. En haut-droite : montagne (→ dessin-contact), lune-soleil (noir/blanc), étoile (pop-up « aléas du jour » au milieu, ✕ pour fermer).
> - Page dessin : formulaire de contact + mail + IBAN.
> - Titres digitaux avec sigles : ⫸ Kinematik ⫷ · ※ Films pour les oreilles ※ · ▵ Carnets de bord ▵.
> - Kinematik : maison HG ; soleil-lune + étoile + montagne HD ; ≡→✕ au centre. Vidéos désalignées, tailles ≠ ; hover = image change + titre/durée/année ; clic = pop-up vidéo plein écran (✕, ‹ ›).
> - Films pour les oreilles p.1 : 3 albums + petit « i » manuscrit (infos, un i différent chacun). p.2 : clic titre → album (layout simple + saut ±30s) ; clic i → infos pop-up.
>   - L'apparition des coquillages (Compostelle, 100 épisodes Spotify).
>   - Mourir c'est pas si grave (6 épisodes, titres fournis).
>   - Chronique du dernier souffle (3 épisodes : Fumée et Pardon / Lise Barkas / Le Souffle des Morts).
> - Bio : accès depuis le nom (menu) ou depuis le menu ≡. Police : arsenale white.
> - Carnets de bord : présentation collage « de traviole ».
>
> **Mail antérieur (idées, en partie superseded) :** domaine `vvvjjjmmm.com` ; enlever Waniushka/Œuvres ; nom « Vania Jaikin Miyazaki » manuscrit fond transparent ; icônes soleil/lune/étoile/montagne transparentes ; l'étoile = aléas, la montagne = dessin (Excalidraw) ; sauts ±30s et ±1min ; sigles infos avec photo/références ; flèches retour menu. Fonds papier quadrillé/pointillé/triangles → **abandonnés** dans la version finale.
