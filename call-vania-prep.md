# Prépa call Vania — maquette (perso, Jonathan)

> Maquette en ligne locale : `python -m http.server 8123` → http://localhost:8123/index.html
> C'est une **maquette / prototype** : on montre le parcours et les interactions, pas le rendu final.

---

## 1. Démo — l'ordre à suivre à l'écran
1. **Accueil** : photo aléatoire plein écran + maison au centre → clic pour entrer.
2. **Menu** : son nom en haut-gauche (→ Bio), les 3 titres au centre, les 3 icônes en haut-droite.
3. **Étoile** → pop-up « aléas du jour ». **Lune-soleil** → mode noir/blanc. **Montagne** → Contact.
4. **Kinematik** : survol d'une vidéo (titre/durée/année), clic → lecture plein écran + flèches ‹ ›.
5. **Films** : les 3 albums + « i » infos → un album → le lecteur avec les sauts ±30s / ±1min.
6. **Carnets** : le collage penché → clic → image en grand + flèches.
7. **Contact** : formulaire + zone dessin (tracer un trait) + son IBAN.
8. Le menu ≡ au centre (sur les pages) : se transforme en ✕.

---

## 2. Fidèle à ses wireframes (à dire pour rassurer)
Tout ce qu'elle a dessiné y est : structure des pages, le menu ≡→✕ au milieu, les sigles `⫸ ※ ▵`,
la lightbox vidéo/image, le lecteur avec sauts 30s/1min, la zone dessin, l'IBAN, les pop-up infos/aléas.

---

## 3. À lui DEMANDER (ce qui me manque pour avancer)
- **Ses sigles/icônes en PNG transparent** (fond blanc actuellement inutilisable) : nom manuscrit, maison, étoile, lune, soleil, montagne, i.
- Un **« i » différent par album** (elle l'avait dit).
- La **police « arsenale white »** (fichier) pour la Bio.
- Le **texte des « aléas du quotidien »** (ceux du drive).
- Les **100 titres** de *L'apparition des coquillages* (export Spotify), si elle y tient tout de suite.
- Les **fichiers audio** (kdrive) si elle veut un vrai lecteur — sinon on reste sur le lecteur « pour la forme ».

---

## 4. À TRANCHER avec elle
- **3 sections** (Kinematik / Films / Carnets) comme sur son wireframe Menu — OU on réintègre les **photos « 1/60e de seconde »** et les **Fragments de discours intérieurs** ?
- **Zone dessin** : j'ai mis un petit outil maison (pas Excalidraw). OK pour elle ?
- **Nom manuscrit** : là c'est du texte en italique. Elle fournit son image écrite à la main (VJM) ?
- **Mourir c'est pas si grave** : 6 épisodes (le mail) ou 2 de 54' (le doc) ?
- Domaine **vvvjjjmmm.com** : on confirme ?

---

## 5. Choix par défaut que j'ai faits (à valider vite fait)
- Fonds « papier quadrillé / pointillé / triangles » → **abandonnés** (l'étoile sert aux aléas maintenant, comme dans sa version finale).
- Titres de section en typo « digitale » (sans-serif), comme elle l'a demandé.
- Mode noir/blanc = un seul bouton lune-soleil.

---

## 6. Message clé à passer
> « C'est une maquette pour valider le parcours et le ressenti. Une fois qu'on est d'accord dessus,
> je reconstruis un site propre et définitif — et c'est là qu'on cale le rendu fin, tes dessins à la main, la vraie typo. »
