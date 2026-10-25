# Dernière news sous le menu + particules façon iirrm

> **Statut** : DONE (code) · **Livré** : 2026-10-25 · **Commits** : `0fe5bbc..700f5dd` (branche `news-particules`)

## Ce que ça fait
Vania publie un article depuis le CMS (collection « Articles (news) ») ; le plus récent article publié apparaît sur `/menu`, sous le pli, avec un indicateur « dernière news » en bas de l'écran. Le haut du menu reçoit un nuage de 5000 pixels attirés par le curseur, repris de l'effet d'iirrm.ch. Sans article publié, le menu garde sa hauteur d'avant.

Ne pas confondre avec la collection `news` (annonce datée sous le nom, pop-up) : `articles` est distincte.

## Comment ça marche
1. **Contenu** : un fichier `content/articles/AAAA-MM-JJ-slug.json` par article (`titre`, `date`, `publie`, `image` optionnelle, `corps` markdown). Schéma Zod `articles` dans `src/content.config.ts` (loader `glob`, id = nom de fichier sans extension). `publie` vaut `true` par défaut.
2. **Images** : `tools/build-images.mjs` : `loadImageSources()` lit `content/articles/` via le helper local `folder()` (écarte `publie === false`) ; `resolveImages()` redimensionne l'image de couverture (`max: 1600`) et passe `articles` dans `resolveTextImages` pour les images du corps.
3. **Page** : `src/pages/menu.astro` prend `getCollection("articles", publie)`, trie par `date` décroissante, garde le premier. Si présent : `<main class="avec-news">` passe à `min-height: 90vh/90svh`, un lien `.defiler` (`#news`) s'affiche, et un `<article id="news">` est rendu après `<main>` (date en `<time>`, `h2`, couverture via `image()`, corps via `renderMarkdown` + `withImageVariants`, classe `vjm-prose`).
4. **Particules** : `src/islands/DotField.jsx` (`client:load`, monté dans `<main>`). Canvas absolu `inset:0`, `z-index:-1`, `pointer-events:none`, taille = celle de `main`. 5000 points `{x,y,a,b}` ; à chaque image : effacement des pixels, puis pour chaque point accélération `GRAVITY / (distance + 0.01)` vers la dernière position du curseur, déplacement, wrap aux bords, friction `0.96`, puis `putImageData`. Le curseur n'est suivi que s'il est dans le canvas (`pointermove` sur `window` + `getBoundingClientRect`).

```
content/articles/*.json --glob--> getCollection("articles") --> menu.astro --> <article id="news">
CMS (config.yml: articles) --écrit--> content/articles --> build-images.mjs --> images redimensionnées
```

## Carte du code
> Mise à jour : 2026-10-25

| Fichier | Rôle |
|---|---|
| `content/articles/2026-10-25-exemple.json` | Article d'exemple, `publie: false` (n'apparaît pas) |
| `src/content.config.ts` | Collection `articles` et son schéma |
| `public/admin/config.yml` | Collection CMS « Articles (news) » (dossier, slug `{{year}}-{{month}}-{{day}}-{{slug}}`, champs) |
| `tools/build-images.mjs` | `folder()`, `loadImageSources().articles`, redimensionnement de la couverture |
| `src/pages/menu.astro` | Sélection de l'article, indicateur, section `#news`, styles |
| `src/islands/DotField.jsx` | Effet de particules |

### Décisions clés
- Collection `articles` séparée de `news` — `news` est une annonce unique en pop-up, ici un fichier par article (détail daté → DECISIONS.md)
- Port fidèle de l'effet iirrm (pixels + `putImageData`) plutôt que des arcs `Path2D` — rendu et coût proches de la référence
- `main` à 90vh seulement si un article est publié — le menu reste plein écran sinon

## Comment débuguer
- **Par où entrer** : `menu.astro` (frontmatter) pour l'article ; `DotField.jsx` `loop()` pour les particules.
- **Ce qu'on observe** : `dist/menu.html` contient `id="news"` si un article est publié ; `src/generated/images.json` contient la couverture ; canvas visible dans les DevTools sous `main`.
- **Pannes connues** :
  - Article absent du menu → `publie: false`, ou `date` au mauvais format (le schéma `day` l'exige) → corriger le JSON.
  - Build en échec sur `image` → chemin non listé/inexistant dans `public/assets/` → vérifier le chemin.
  - Particules figées → `prefers-reduced-motion`, onglet caché, ou section hors écran (voulu).
- **Pièges** : le tri se fait sur `date` en chaîne (`localeCompare`), deux articles du même jour : ordre non garanti · l'encre vient de `--fg` et se relit sur changement de `data-theme` · le canvas n'est dessiné que dans `main` : il défile avec lui.

## Configuration
Aucune variable d'env. CMS : collection `articles` dans `public/admin/config.yml`. Constantes de l'effet en tête de `DotField.jsx` : `COUNT` 5000, `GRAVITY` 20, `FRICTION` 0.96.

## Tests et vérifications
| Vérif | Commande | Résultat réel |
|---|---|---|
| Tests du site | `npm test` | 36 pass, 0 fail, mais ils lisent un `dist/` non reconstruit pour cette feature |
| Build complet avec un article publié | `npm run build` | non relancé |
| Rendu visuel (indicateur, particules, thème sombre) | navigateur | non vérifié par doc-keeper |

## Limites et dettes
- Vitesse liée au framerate : pas de delta-temps, un écran 120 Hz va 2x plus vite.
- Canvas sans `devicePixelRatio` : flou sur écrans haute densité.
- Pas de test automatisé sur `articles` ni sur `DotField`.
- Le canvas à `z-index:-1` dépend d'un contexte d'empilement parent : à contrôler visuellement.
- Particules actives aussi au tactile (l'ancienne version était coupée sur `pointer: coarse`) ; sans curseur elles gravitent vers le centre.
- `docs/features/migration-astro.md` cite encore l'ancien `DotField` (houle, `seededRandom` dupliqué) : obsolète.
- Pas de tri secondaire pour deux articles du même jour.
