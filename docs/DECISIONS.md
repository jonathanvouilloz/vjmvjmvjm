# DECISIONS

Format : `date | décision | contexte | alternatives considérées`

- 2026-09-17 | Plateformes de playlist en liste fixe (+ « Autre » en lien) | Le build doit construire l'URL du lecteur intégré de chaque plateforme | Champ libre (pas de lecteur possible, libellés incohérents)
- 2026-09-17 | Textes riches (albums, Coin lecture) en un seul champ Markdown ; une URL vidéo seule sur sa ligne devient un lecteur | Vania édite seule dans Sveltia : moins de clics | Garder la liste de blocs typés (plus structurée, plus lourde à éditer)
- 2026-09-17 | Résumé d'album ≤ 300 caractères en texte brut, le reste passe dans `contenu` | Le « i » ne montre plus qu'un résumé court | Garder des blocs dans la pop-up du « i »
