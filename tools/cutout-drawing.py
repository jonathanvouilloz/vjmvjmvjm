"""Détoure les dessins manuscrits de Vania en PNG transparents.

Deux familles de sources, même traitement :
  · `JONATHAN/Sigles/` — photos de papier bleu-gris au stylo noir → `assets/brand/`
  · `JONATHAN/Aléas quotidien (*étoile*)/` — phrases écrites à la main → `assets/aleas/`

On ne peut pas les utiliser telles quelles : le fond blanc/bleu casse le thème sombre et se
voit sur les fonds colorés. Ce script transforme la luminance en canal alpha (papier →
transparent, encre → opaque), puis recadre sur le trait — ou découpe une planche en plusieurs
dessins isolés.

Le RVB de sortie est noir plat : le site inverse en thème sombre via `filter: var(--ink-invert)`.

Usage : python tools/cutout-drawing.py
Sorties : assets/brand/*.png, assets/aleas/alea-NN.png
"""

import sys
from pathlib import Path
from collections import deque

from PIL import Image, ImageFilter, ImageOps

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIGLES = ROOT / "JONATHAN" / "Sigles"
ALEAS = ROOT / "JONATHAN" / "Aléas quotidien (_étoile_)"
OUT = ROOT / "assets" / "brand"
OUT_ALEAS = ROOT / "assets" / "aleas"

# Seuils de séparation encre / papier, en percentiles de luminance.
# Le papier occupe l'écrasante majorité des pixels, l'encre les plus sombres.
PAPER_PCT = 55  # au-dessus → totalement transparent
INK_PCT = 1.0   # en-dessous → totalement opaque


def load(path):
    """Ouvre un scan en appliquant son orientation EXIF (photos prises à la verticale)."""
    return ImageOps.exif_transpose(Image.open(path))


def to_alpha(img):
    """Image RVB d'un scan → image L où 255 = encre pleine, 0 = papier."""
    gray = img.convert("L")
    hist = gray.histogram()
    total = sum(hist)

    def percentile(p):
        target, acc = total * p / 100.0, 0
        for value, count in enumerate(hist):
            acc += count
            if acc >= target:
                return value
        return 255

    paper, ink = percentile(PAPER_PCT), percentile(INK_PCT)
    span = max(paper - ink, 1)
    # Rampe linéaire inversée + coupure basse : sans elle, le grain du papier et le bruit
    # JPEG ressortent en voile gris autour du trait.
    lut = []
    for v in range(256):
        a = (paper - v) / span
        a = 0.0 if a < 0.18 else min(1.0, (a - 0.18) / 0.82)
        lut.append(int(round(a * 255)))
    return gray.point(lut)


def components(alpha, cell=6, min_cells=6):
    """Boîtes englobantes des groupes de traits, via une grille grossière.

    Travailler par cellules de `cell` px agit comme une dilatation : deux traits proches
    (le point d'un « i », les branches d'une étoile) tombent dans le même groupe.
    """
    w, h = alpha.size
    cw, ch = (w + cell - 1) // cell, (h + cell - 1) // cell
    px = alpha.load()

    filled = [[False] * cw for _ in range(ch)]
    for cy in range(ch):
        for cx in range(cw):
            for y in range(cy * cell, min((cy + 1) * cell, h)):
                if filled[cy][cx]:
                    break
                for x in range(cx * cell, min((cx + 1) * cell, w)):
                    if px[x, y] > 110:
                        filled[cy][cx] = True
                        break

    seen = [[False] * cw for _ in range(ch)]
    boxes = []
    for cy in range(ch):
        for cx in range(cw):
            if not filled[cy][cx] or seen[cy][cx]:
                continue
            q, cells = deque([(cx, cy)]), []
            seen[cy][cx] = True
            while q:
                x, y = q.popleft()
                cells.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < cw and 0 <= ny < ch and filled[ny][nx] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            q.append((nx, ny))
            if len(cells) < min_cells:
                continue
            xs = [c[0] for c in cells]
            ys = [c[1] for c in cells]
            boxes.append((min(xs) * cell, min(ys) * cell,
                          min((max(xs) + 1) * cell, w), min((max(ys) + 1) * cell, h)))
    # ordre de lecture : haut → bas
    return sorted(boxes, key=lambda b: (b[1], b[0]))


def save(alpha, box, path, pad=8, max_side=320):
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(alpha.size[0], x1 + pad), min(alpha.size[1], y1 + pad)
    a = alpha.crop((x0, y0, x1, y1))

    scale = max_side / max(a.size)
    if scale < 1:
        a = a.resize((max(1, round(a.size[0] * scale)), max(1, round(a.size[1] * scale))),
                     Image.LANCZOS)
    # Le rééchantillonnage rend le trait laiteux : un léger renforcement le rétablit.
    a = a.point(lambda v: min(255, int(v * 1.25)))

    out = Image.new("RGBA", a.size, (0, 0, 0, 0))
    out.putalpha(a)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path)
    print(f"  {path.relative_to(ROOT)}  {out.size[0]}x{out.size[1]}")


def whole(src, out_path, max_side=900, pad=14):
    """Détoure l'image entière (un seul dessin sur la feuille)."""
    print(f"{src.name} → {out_path.name}")
    alpha = to_alpha(load(src))
    # `getbbox()` retiendrait le moindre pixel résiduel : on recadre sur l'encre franche,
    # sinon la marge blanche du scan reste dans le PNG et décentre le nom.
    ink = alpha.point(lambda v: 255 if v > 70 else 0)
    save(alpha, ink.getbbox() or (0, 0, *alpha.size), out_path, pad=pad, max_side=max_side)


def pieces(src_name, names, max_side=200, order="reading"):
    """Découpe une planche de sigles en un PNG par sigle.

    `order` : « reading » trie haut→bas (planches empilées), « row » trie gauche→droite
    (les deux caméras sont côte à côte, à la même hauteur au pixel près).

    Quand le scan déborde sur un dessin voisin ou garde un éclat de grain, `components()`
    rend plus de groupes que de noms attendus : on ne retient alors que les plus gros, qui
    sont toujours les sigles, avant de les remettre dans l'ordre demandé.
    """
    print(f"{src_name} → {len(names)} sigles")
    alpha = to_alpha(load(SIGLES / src_name))
    alpha = alpha.filter(ImageFilter.MedianFilter(3))  # tue le poivre-et-sel du JPEG
    boxes = components(alpha)
    if len(boxes) > len(names):
        print(f"  {len(boxes)} groupes détectés → on garde les {len(names)} plus gros")
        area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
        boxes = sorted(boxes, key=area, reverse=True)[:len(names)]
    elif len(boxes) < len(names):
        print(f"  ⚠ {len(boxes)} groupes détectés pour {len(names)} noms attendus")
    key = (lambda b: b[0]) if order == "row" else (lambda b: (b[1], b[0]))
    for box, name in zip(sorted(boxes, key=key), names):
        if name:
            save(alpha, box, OUT / f"{name}.png", max_side=max_side)


def aleas():
    """Les 24 phrases manuscrites du dossier « Aléas quotidien ».

    Numérotées dans l'ordre chronologique des noms de fichiers (photo_AAAA-MM-JJ hh.mm.ss),
    qui est l'ordre dans lequel Vania les a écrites. Plus larges que les sigles : ce sont des
    phrases de deux à trois lignes, lues en pop-up.
    """
    OUT_ALEAS.mkdir(parents=True, exist_ok=True)
    for f in OUT_ALEAS.glob("alea-*.png"):
        f.unlink()
    files = sorted(p for p in ALEAS.iterdir() if p.suffix.lower() in {".jpeg", ".jpg", ".png"})
    for i, path in enumerate(files, 1):
        whole(path, OUT_ALEAS / f"alea-{i:02d}.png", max_side=1400, pad=10)


if __name__ == "__main__":
    whole(SIGLES / "VJM_3.jpeg", OUT / "nom-manuscrit.png")
    # Planche « pop-up », dans l'ordre de lecture : vague, 5 spirales, vague, 5 étoiles.
    pieces("sigles_pop-up.jpeg", [
        "sigle-vague-1",
        "sigle-spirale-1", "sigle-spirale-2", "sigle-spirale-3", "sigle-spirale-4",
        "sigle-spirale-5",
        "sigle-vague-2",
        "sigle-etoile-1", "sigle-etoile-2", "sigle-etoile-3", "sigle-etoile-4",
        "sigle-etoile-5",
    ])
    # Les deux caméras encadrent « Biofilmographie » sur la page bio.
    pieces("sigles_caméras.jpeg", ["sigle-camera-1", "sigle-camera-2"], order="row")
    aleas()
