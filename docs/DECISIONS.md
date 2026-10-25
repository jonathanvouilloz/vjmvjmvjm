# DECISIONS

Format : `date | décision | contexte | alternatives considérées`

- 2026-09-17 | Plateformes de playlist en liste fixe (+ « Autre » en lien) | Le build doit construire l'URL du lecteur intégré de chaque plateforme | Champ libre (pas de lecteur possible, libellés incohérents)
- 2026-09-17 | Textes riches (albums, Coin lecture) en un seul champ Markdown ; une URL vidéo seule sur sa ligne devient un lecteur | Vania édite seule dans Sveltia : moins de clics | Garder la liste de blocs typés (plus structurée, plus lourde à éditer)
- 2026-09-17 | Résumé d'album ≤ 300 caractères en texte brut, le reste passe dans `contenu` | Le « i » ne montre plus qu'un résumé court | Garder des blocs dans la pop-up du « i »
- 2026-10-05 | Images listées dans `content/` et préparées au build par sharp (dimensions, réduction, vignettes) | Vania n'a que le CMS : un script local Python pour chaque image la rendrait dépendante de Jonathan | Netlify Image CDN (pas de dimensions au build, rien en local) ; garder `import-images.py` seul
- 2026-10-05 | ffmpeg fourni par npm (`ffmpeg-static`) quand il manque | L'image de build Netlify n'a pas ffmpeg | Committer l'audio déjà optimisé (double source de vérité)
- 2026-10-05 | Vignette image du Coin lecture rétablie | Demandée dans la liste de retours ; l'itération 6 l'avait retirée | Titre ou extrait seulement
- 2026-10-20 | Migration vers Astro statique, dans le même repo (branche `astro`), `content/` inchangé | Une seule URL aujourd'hui : rien d'indexable ni de partageable, le bouton retour quitte le site | Routage `#` dans le React actuel (jeté par la migration) ; nouveau repo (Netlify, OAuth CMS, Action et accès Vania à re-câbler)
- 2026-10-20 | Slug Kinematik : champ `slug` facultatif dans le CMS, repli sur `id` | URL lisible qui ne bouge pas si Vania renomme le film | `id` seul (`/kinematik/k1`) ; slug tiré du titre (casse les liens au renommage)
- 2026-10-20 | Loader `json()` maison pour les collections Astro | Le loader `file` d'Astro laisse passer un JSON illisible ou un doublon avec une collection vide | Loader `file` + `prerenderConflictBehavior: "error"` (ne couvre pas le JSON illisible)
- 2026-10-20 | `build.format: "file"` (pages `menu.html`, URL sans slash final) | Canoniques, liens internes et sitemap doivent concorder ; Netlify sert `/menu` sans redirection. À vérifier sur une deploy preview (`kinematik.html` + dossier `kinematik/`) | `trailingSlash: "always"` (impose de réécrire tous les liens internes)
- 2026-10-20 | Lecteur audio non persisté entre pages | L'ancien `AudioPlayer` était monté dans `AlbumPage` et se coupait au démontage : parité, le plan croyait à tort que l'audio continuait | `transition:persist` du lecteur (fonctionnalité à ajouter plus tard si voulue)
- 2026-10-20 | Collision de slug de carnet : le second prend `{dossier}-{nom}` | `boule-disco`, `bourgeois`, `la-soupe` existent dans `carnets/` et `home/` ; URL stables, 117 tuiles, ordre inchangé | Suffixe numérique (instable), erreur de build (bloque Vania)
- 2026-10-20 | `/carnets/{slug}` en noindex avec canonical vers `/carnets`, hors sitemap | Contenu trop mince (une image), plan §3 | Indexer les 117 pages
- 2026-10-20 | Ancien pipeline supprimé (`precompile.mjs`, `tools/build-content.mjs`, `design-extract/`, `build.py`, `tools/fetch-thumbs.py`, `tools/package-netlify.py`, Babel) | Remplacé par Astro ; l'historique git garde tout. Perte : poster Vimeo plus récupéré automatiquement | Archiver `design-extract/`
- 2026-10-20 | Node `>=22.22.0` (`engines`, `NODE_VERSION`) | Exigence d'Astro 7 | —
- 2026-10-20 | Tests de pages sur `dist/`, ignorés si `dist/` est absent | Les anciens tests lisaient des regex sur le JSX | Build dans le test
- 2026-10-25 | Collection `articles` distincte de `news`, un fichier JSON par article ; le menu montre le plus récent publié | `news` est l'annonce unique en pop-up, pas un fil | Étendre `news` en liste (casse l'ancre `&blocks` et la pop-up)
- 2026-10-25 | `DotField` : port de l'effet iirrm.ch (5000 pixels, gravité 20/distance, friction 0.96, `putImageData`), canvas dans `main` | Rendu voulu par la cliente comme la référence ; remplace la houle douce du 2026-10-20 | Garder le semis `Path2D` à houle
