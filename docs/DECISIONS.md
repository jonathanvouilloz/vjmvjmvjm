# DECISIONS

Format : `date | décision | contexte | alternatives considérées`

- 2026-09-17 | Plateformes de playlist en liste fixe (+ « Autre » en lien) | Le build doit construire l'URL du lecteur intégré de chaque plateforme | Champ libre (pas de lecteur possible, libellés incohérents)
- 2026-09-17 | Textes riches (albums, Coin lecture) en un seul champ Markdown ; une URL vidéo seule sur sa ligne devient un lecteur | Vania édite seule dans Sveltia : moins de clics | Garder la liste de blocs typés (plus structurée, plus lourde à éditer)
- 2026-09-17 | Résumé d'album ≤ 300 caractères en texte brut, le reste passe dans `contenu` | Le « i » ne montre plus qu'un résumé court | Garder des blocs dans la pop-up du « i »
- 2026-10-05 | Images listées dans `content/` et préparées au build par sharp (dimensions, réduction, vignettes) | Vania n'a que le CMS : un script local Python pour chaque image la rendrait dépendante de Jonathan | Netlify Image CDN (pas de dimensions au build, rien en local) ; garder `import-images.py` seul
- 2026-10-05 | ffmpeg fourni par npm (`ffmpeg-static`) quand il manque | L'image de build Netlify n'a pas ffmpeg | Committer l'audio déjà optimisé (double source de vérité)
- 2026-10-05 | Vignette image du Coin lecture rétablie | Demandée dans la liste de retours ; l'itération 6 l'avait retirée | Titre ou extrait seulement
- 2026-10-20 | Migration vers Astro statique, dans le même repo (branche `astro`), `content/` inchangé | Une seule URL aujourd'hui : rien d'indexable ni de partageable, le bouton retour quitte le site | Routage `#` dans le React actuel (jeté par la migration) ; nouveau repo (Netlify, OAuth CMS, Action et accès Vania à re-câbler)
