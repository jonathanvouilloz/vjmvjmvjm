# Feature — Itération 7 : tout le contenu éditable, vignette image, semis du menu

## Etat session 2026-10-05

**Fait :**
- toutes les images du site sont listées dans `content/` et éditables dans Sveltia : carnets, photos d'accueil, aléas, autoportraits, vignettes Kinematik ;
- le build prépare lui-même les images (`tools/build-images.mjs`, sharp) : dimensions, réduction, vignettes. Une photo de téléphone peut être déposée telle quelle depuis le CMS ;
- la vignette du Coin lecture peut être une image seule (en plus du titre ou d'un extrait) ;
- la description SEO et les `sameAs` viennent de `content/site.json` ;
- le semis de points du menu pâlit au centre et suit davantage la souris ;
- 33 tests verts ; Playwright sur `dist/` et sur un dépôt simulé de 4000 px.

**Prochain :** activer la connexion GitHub de `/admin/` (OAuth App + Netlify), puis faire tester Vania.

**Pieges :**
- `content/carnets.json` & co. sont la source : `tools/import-images.py` les complète sans les réécrire (titres et ordre du CMS conservés).
- `assets/_gen/` est généré et ignoré par git ; il est purgé à chaque build de ce qui n'est plus référencé.
- Une image listée mais absente est ignorée avec un avertissement dans le log de build, sans casser la mise en ligne.
- Les identifiants des images sont leurs chemins : deux fichiers de même nom dans deux dossiers ne se confondent pas.

**Commit :** voir `git log` — feat: make every image editable in the CMS

---

## Carte du code
> Mise a jour : 2026-10-05

| Fichier | Role |
|---------|------|
| `tools/build-images.mjs` | `createImageBuilder` (dimensions, variantes, vignettes, purge), `resolveImages` (galeries, vignettes Kinematik/lecture, images des textes) |
| `tools/build-content.mjs` | `loadContent` lit aussi `carnets.json`, `accueil.json`, `aleas.json`, `bio.json → portraits` |
| `precompile.mjs` | `CONTENT.images = await resolveImages(CONTENT)` ; injection description + `sameAs` |
| `admin/config.yml` | collections Accueil, Carnets, Aléas ; portraits dans Bio ; `vignette` Kinematik ; vignette image du Coin lecture ; description |
| `content/carnets.json`, `accueil.json`, `aleas.json` | listes d'images (migrées depuis l'ancien `waniushka-assets.jsx`, supprimé) |
| `design-extract/.../waniushka-components.jsx` | galeries lues dans `CONTENT.images` |
| `design-extract/.../waniushka-app.jsx` | `DotField` (fondu central, sillage), `ReadingTile` (image), `KinTile` (`vignette`) |
| `tools/import-images.py` | import en masse depuis `JONATHAN/`, fusion dans `content/` |
| `tools/optimize-dist.py` | réencode tous les MP3 de `dist/assets/` (y compris `uploads/`) |

### Decisions cles
- Images traitées au build plutôt que par un script local : Vania n'a que le CMS.
- La vignette image du Coin lecture revient : la liste de retours la demande (l'itération 6 l'avait retirée).
- L'interface (libellés du menu, sigles, formulaire) reste dans le code : ce n'est pas du contenu.

## Retours traités (liste du 2026-10-05)

| Demande | État |
|---|---|
| « i » facultatif sur les vignettes vidéo | déjà fait (itération 6) |
| Playlists multi-plateformes, plusieurs par plateforme, texte libre | déjà fait (itération 6, `langue` + `libelle`) |
| « i » = résumé ≤ 300, page = texte riche | déjà fait (itération 6) |
| Notes du Coin lecture plus petites, texte riche | déjà fait (itération 6) |
| Vignette lecture : extrait ≤ 300, image seule ou titre | fait ici (option image) |
| Points plus clairs au centre, qui suivent plus la souris | fait ici |
| Toutes les données éditables dans le CMS | fait ici |
