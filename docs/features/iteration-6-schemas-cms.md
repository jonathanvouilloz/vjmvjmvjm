# Feature — Itération 6 : schémas CMS figés (playlists, textes riches, vignettes, « i » Kinematik)

## Etat session 2026-09-17

**Fait :**
- schémas Sveltia figés : `resume`, `playlists` et `contenu` pour les albums ; `corps` et une vignette titre/extrait pour le Coin lecture ; `information` pour Kinematik ;
- le build convertit les URL de playlist et les vidéos seules sur leur ligne en lecteurs intégrés ;
- page album refaite : langue, onglets de plateforme, liens ; « i » Kinematik ; notes réduites ;
- contenus migrés ; 31 tests verts ; Playwright OK sur le build de travail et sur `dist/`.

**Prochain :** saisir dans le CMS les vraies URL de playlist dès que Vania les fournit (tâche dans `wania-human.md`). Ensuite, activer le CMS : repo GitHub + Netlify, voir l'itération 5.

**Pieges :**
- Au tactile, un tap émet `pointerenter` et `mouseleave`. Le survol et la fermeture du « i » Kinematik ne réagissent donc qu'à `pointerType === 'mouse'`, et le focus qu'à `:focus-visible`.
- Le résumé d'album est du texte brut : un lien Markdown n'y serait pas rendu.
- Le compteur de 300 caractères et l'insertion d'image dans Sveltia n'ont pas été testés en vrai : le mode dépôt local demande un sélecteur de dossier.

**Commit :** a0f50ad feat: freeze CMS schemas for playlists, rich text and Kinematik info

---

## Carte du code
> Mise a jour : 2026-09-17

| Fichier | Role |
|---------|------|
| `admin/config.yml` | Schémas Sveltia : playlists (plateformes et langues fixes), champs Markdown, limites à 300 caractères, ancre `&blocks` sur les news |
| `tools/build-content.mjs` | `playlistEmbed` (URL → lecteur), `videoEmbed` et figures dans le Markdown, champs `RICH` / `PLAIN` |
| `content/albums.json`, `content/lecture/ma-mere.json`, `content/kinematik.json` | Contenus migrés vers le nouveau schéma |
| `design-extract/site-minimalist-portoflio/project/waniushka-app.jsx` | `Playlists`, `AlbumPage`, `FilmsPage` (« i » conditionnel), `KinTile` (« i » information), `ReadingTile`/`ReadingText`, `LangSwitch` généralisé |
| `design-extract/site-minimalist-portoflio/project/waniushka-components.jsx` | `PlaylistEmbed` (remplace `SpotifyEmbed`) |
| `design-extract/site-minimalist-portoflio/project/Waniushka Portfolio.html` | Notes réduites (`.vjm-notes`, `.fn-ref`), styles `.vjm-video` et images du texte riche |
| `tests/site.test.mjs` | Tests des embeds, du schéma, des albums, du « i » Kinematik et des notes |

### Decisions cles
- Plateformes en liste fixe : le build doit savoir construire l'URL du lecteur. « Autre » reste un simple lien.
- Un seul champ Markdown pour les textes riches. La bio, les news et le résumé Kinematik gardent les blocs.
- Le texte de Vania n'est jamais réécrit pour tenir en 300 caractères : ce qui dépasse passe dans `contenu`.

## Détail de l'itération (DONE)

Vania va éditer seule dans Sveltia une fois le site sur Netlify. Les schémas de
`admin/config.yml` sont donc figés avant l'activation.

### Décisions (prises avec Jonathan)

- **Plateformes en liste fixe + « Autre »**. Le build doit connaître la plateforme pour
  convertir l'URL en lecteur intégré.
  - Avec lecteur : Spotify, Apple Music, Apple Podcasts, Deezer, YouTube, SoundCloud.
  - En lien : Bandcamp, Amazon Music, Autre (libellé libre).
  - Langues fixes : fr, en, es, de, it, pt. Une ligne de config pour en ajouter une.
- **Un seul champ Markdown riche** (`corps`, `contenu`), plutôt que des blocs.
  - Images : bouton de l'éditeur ; le titre Markdown sert de légende.
  - Vidéo : une URL Vimeo ou YouTube seule sur sa ligne.
  - Les notes `[^1]` fonctionnent toujours.
  - La bio, les news et le résumé Kinematik gardent les blocs.
- **Vignettes du Coin lecture** : titre ou extrait de 300 caractères au plus. L'image disparaît.
- **Playlists** : un seul lecteur à la fois. On choisit la langue (FR · ES…), puis la plateforme par onglets. Les plateformes sans lecteur s'affichent en liens `↗`.

### Schéma

| Contenu | Changement |
|---|---|
| Album | `infos` (blocs) → `resume` (texte ≤ 300, le « i »). `spotify` → `playlists[] {plateforme, libelle, langue, url}`. Ajout de `contenu` (Markdown, page album). `episodes` inchangé. |
| Texte lecture | `blocks` → `corps` (Markdown). `vignette` = `{type: titre\|extrait, extrait ≤ 300}`. |
| Film Kinematik | Ajout de `information` (texte ≤ 300, facultatif). |
| Config | L'ancre `&blocks` passe sur le `blocks` des news. `locale` est retiré (Sveltia l'ignorait avec un avertissement). |

**Migration des contenus**
- **Coquillages**
  - Le résumé perd la phrase « aussi disponibles sur Spotify », redondante avec la playlist.
  - `spotify` devient une playlist `spotify/fr`.
- **Chronique**
  - Le texte faisait 391 caractères.
  - Le résumé garde la 1re phrase, et le texte intégral passe dans `contenu`.
- **Ma Mère** : les blocs sont concaténés dans `corps`. L'image devient `![Oiseau de feu](…)`.

### Build (`tools/build-content.mjs`)

- `corps` et `contenu` produisent `corpsHtml` et `contenuHtml`.
- `resume`, `extrait` et `information` passent par `typo`.
- `videoEmbed(url)` : un `<p>` qui ne contient qu'un lien Vimeo ou YouTube devient `<figure class="vjm-video"><iframe>`.
- Une image seule dans son paragraphe devient `<figure>`, avec `figcaption` si un titre est donné.
- `playlistEmbed({plateforme, url})` renvoie `{embed, hauteur}`, ou `null` quand la plateforme n'a qu'un lien.
  - Chaque playlist reçoit `embed` et `hauteur` au build.
  - YouTube n'a pas de hauteur fixe : le lecteur est en 16/9.

### Rendu

- **Liste des albums** : le « i » n'apparaît que si `resume` est rempli.
- **Page album** : titre + « i », puis le lecteur MP3 (s'il y a des épisodes), puis `Playlists`, puis `contenu`.
- **Pop-up du « i »** : elle affiche `resume`.
- `SpotifyEmbed` devient `PlaylistEmbed`.
- `LangSwitch` est généralisé (`langs`, `label`). La langue par défaut est celle de la bio, si elle existe dans la liste.
- **`ReadingTile`** : la branche image est supprimée.
- **`ReadingText`** : rend `corpsHtml` dans `.vjm-prose`.
- **Notes** : `.vjm-notes` passe de `0.86em` à `0.72em` (interligne 1.55) ; `.fn-ref` de `0.7em` à `0.6em`.
- **`KinTile`** : un « i » manuscrit (`info-album-{1..3}.svg`) sur pastille en haut à droite, seulement si `information` est rempli.
  - Survol à la souris, ou focus clavier : le voile montre l'information à la place du titre.
  - Clic ou tap : épingle l'information, sans ouvrir la lightbox.
  - Deux pièges tactiles :
    - le navigateur émet `pointerenter` et `mouseleave` autour d'un tap. Le survol et la fermeture ne répondent donc qu'à `pointerType === 'mouse'` ;
    - le focus n'ouvre l'information que s'il est `:focus-visible`.

### Vérifié

- `npm test` : 31 tests verts, dont 6 nouveaux (embeds, auto-vidéo, schéma, albums, « i » Kinematik, notes).
- Playwright sur le build de travail, avec des données de test temporaires retirées ensuite, en desktop et en mobile tactile :
  - Kinematik : « i » au survol et au tap, second tap qui referme, aucune lightbox ouverte ;
  - albums : résumé dans la pop-up, onglets Spotify / Deezer, lien Bandcamp, bascule ES → YouTube, `contenu` avec vidéo Vimeo et image légendée ;
  - lecture : vignette extrait, texte avec vidéo YouTube et figure, note avec aller-retour.
- `dist/` avec le vrai contenu : aucun « i » Kinematik, parcours albums et lecture corrects, zéro erreur console.
  - Sur le build de travail, seuls restent des avertissements « Permissions policy » émis par les iframes tierces.
- `/admin/` : Sveltia charge le schéma sans erreur ni avertissement.
- Non vérifié, car le mode dépôt local demande un sélecteur de dossier : le compteur de 300 caractères et l'insertion d'image dans l'éditeur riche.

### Reste

- Les vraies URL de playlist par plateforme et par langue, à obtenir de Vania (`wania-human.md`).
- Le point CI Netlify de l'itération 5 (`optimize-dist.py` / ffmpeg) reste ouvert.
