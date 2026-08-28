# HANDOFF — 2026-08-08

## Features actives
| Feature | Fichier | Statut |
|---------|---------|--------|
| Itérations 2 → 4 — maquette MVP (wireframes + retours Vania) | docs/features/maquette-iteration-2.md | **EN COURS** |
| Site propre v1 (reconstruction) | — | EN ATTENTE |

## Reprendre ici
Itération 4 livrée : bio allégée (présentation seule, en Newsreader) + biofilmographie en pop-up
derrière les deux caméras dessinées ; aléas passés aux 24 phrases manuscrites de Vania ; player
audio réel sur les vrais MP3 (kdrive) avec durées ffprobe et embed Spotify pour les coquillages ;
Kinematik en collage à formats mêlés, trailers signalés, vignettes rapatriées de Vimeo ; et tout
le dossier d'images importé (53 carnets, 64 photos, 15 autoportraits) via un pipeline générant
`waniushka-assets.jsx`. Vérifié sous Playwright en clair et en sombre, sur le build de travail
**et** sur `dist/` : zéro erreur console, zéro requête locale en échec.

**Les deux licences de police ne bloquent plus.** Arsenale White et Learning Curve n'ont plus
aucun usage — le manuscrit vient des scans de Vania. Rien à acheter, rien à demander.

**Ce qui bloque encore, et qui n'est pas du code :**
1. **Vimeo répond 401 sur les 12 vidéos** (testé une à une, hash compris). Réglage de
   confidentialité « où cette vidéo peut être intégrée » ; antérieur à cette session — la
   lightbox vidéo n'a jamais rien affiché en preview. Sans autorisation du domaine, la page
   Kinematik montre douze vignettes qui n'ouvrent rien.
2. Le poster Vimeo de *Carte Postale de Montevidéo #1 / Opération Béton* est une image noire
   (les 11 autres sont bonnes depuis `tools/fetch-thumbs.py`).
3. Les 2 masters de « Mourir c'est pas si grave » ne portent pas de titre — placeholders en place.
4. `dist/` pèse 102 Mo, dont 65 Mo d'audio (MP3 mono **64 kbps**). Le zip Netlify fait 105 Mo :
   c'est de l'image et du son déjà compressés, la compression zip n'y peut plus rien.

Toujours en attente de Vania : les 100 titres des coquillages (l'embed Spotify les rend en
attendant), la section « livres » (câblée, masquée par `hidden: true`), un « i » par album.

## Commandes
- Build : `node precompile.mjs` (travail) / `node precompile.mjs --prod` (→ `dist/`)
- Preview : `python tools/serve.py 8123` puis `http://localhost:8123/index.html`
  (⚠ **pas** `python -m http.server` : il ignore les requêtes `Range`, tout saut audio
  ramène la lecture à zéro. `file://` reste bloqué par l'extension Chrome.)
- Preview du build de prod : `python tools/serve.py 8124 dist`
- Paquet Netlify : `node precompile.mjs --prod` puis `python tools/package-netlify.py`
  (→ `waniushka-netlify.zip`, contenu de `dist/` à la racine, glisser-déposer).
- Après une livraison d'images de Vania : `python tools/import-images.py` puis rebuild.

Pas de git dans ce dossier.
