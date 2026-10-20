"""Génère les sigles SVG sémantiques depuis les planches vectorielles canoniques.

Les fichiers reçus restent intacts sous `JONATHAN/Sigles/SIGLES_VECT/`. Les planches qui
contiennent plusieurs dessins sont découpées uniquement par leur `viewBox` : les tracés
Potrace ne sont ni rasterisés, ni simplifiés, ni redessinés.
"""

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "JONATHAN" / "Sigles" / "SIGLES_VECT"
OUT = ROOT / "public" / "assets" / "brand"


def number(value):
    return f"{value:.2f}".rstrip("0").rstrip(".")


def traced_group(source_name):
    text = (SOURCE / source_name).read_text(encoding="utf-8")
    match = re.search(r"(<g\b[\s\S]*</g>)\s*</svg>", text)
    if not match:
        raise RuntimeError(f"groupe vectoriel absent dans {source_name}")
    return match.group(1)


def write_piece(source_name, output_name, box, rotate=False, stroke_width=None):
    x, y, width, height = box
    group = traced_group(source_name)
    if stroke_width is not None:
        # Ces trois dessins sont sensiblement plus fins que la lune. Un léger contour, ajouté
        # au tracé généré (jamais à la planche canonique), égalise leur poids sans épaissir la lune.
        original = 'stroke="none"'
        replacement = (
            f'stroke="#000000" stroke-width="{stroke_width}" '
            'stroke-linecap="round" stroke-linejoin="round"'
        )
        if original not in group:
            raise RuntimeError(f"attribut de contour absent dans {source_name}")
        group = group.replace(original, replacement, 1)
    if rotate:
        # Les yeux ont été vectorisés dans l'orientation brute du JPEG. Une rotation horaire
        # retrouve l'orientation horizontale du scan affiché avec ses métadonnées EXIF.
        view_box = f"0 0 {number(height)} {number(width)}"
        transform = f"translate({number(height + y)} {number(-x)}) rotate(90)"
        body = f'<g transform="{transform}">\n{group}\n</g>'
    else:
        view_box = " ".join(number(value) for value in box)
        body = group

    output = OUT / output_name
    output.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="{view_box}" preserveAspectRatio="xMidYMid meet">\n'
        f'{body}\n</svg>\n',
        encoding="utf-8",
    )
    ET.parse(output)
    print(f"  {output.relative_to(ROOT)}")


SINGLES = {
    "nav-star.svg": ("01_etoile-lignes.svg", (285.76, 137.76, 331.48, 351.48), {"stroke_width": 65}),
    "nav-home.svg": ("02_maison.svg", (89.60, 14.60, 450.80, 585.80), {"stroke_width": 90}),
    "nav-moon.svg": ("03_lune.svg", (65.08, 34.08, 165.84, 172.84), {}),
    "nav-mountains.svg": ("04_montagnes.svg", (68.12, 82.12, 650.76, 380.76), {"stroke_width": 100}),
    "nav-sun.svg": ("09_soleil.svg", (268.40, 132.40, 218.20, 226.20), {}),
}

CAMERAS = {
    "sigle-camera-1.svg": (177.0, 476.0, 244.0, 166.0),
    "sigle-camera-2.svg": (606.0, 487.0, 275.0, 168.0),
}

INFO_MARKS = {
    "info-album-1.svg": (250.0, 194.0, 96.0, 102.0),
    "info-album-2.svg": (353.0, 504.0, 100.0, 102.0),
    "info-album-3.svg": (272.0, 746.0, 96.0, 101.0),
    "info-album-4.svg": (359.0, 906.0, 91.0, 99.0),
    "info-album-5.svg": (241.0, 1080.0, 93.0, 91.0),
}

POPUP_MARKS = {
    "sigle-vague-1.svg": (296.1, 109.4, 64.6, 49.5),
    "sigle-spirale-1.svg": (295.1, 228.7, 60.5, 61.7),
    "sigle-spirale-2.svg": (407.1, 278.0, 59.2, 77.6),
    "sigle-spirale-3.svg": (194.0, 305.1, 58.8, 59.2),
    "sigle-spirale-4.svg": (319.0, 365.0, 51.4, 66.5),
    "sigle-spirale-5.svg": (223.7, 421.1, 57.5, 62.6),
    "sigle-vague-2.svg": (321.8, 539.0, 65.9, 45.9),
    "sigle-etoile-1.svg": (315.0, 669.1, 61.9, 81.5),
    "sigle-etoile-2.svg": (366.2, 781.0, 80.8, 81.9),
    "sigle-etoile-3.svg": (265.0, 879.0, 78.8, 88.0),
    "sigle-etoile-4.svg": (376.0, 942.0, 83.4, 99.0),
    "sigle-etoile-5.svg": (293.0, 1068.0, 84.0, 93.0),
}

EYES = {
    "nav-eye-left.svg": (357.8, 303.4, 396.4, 495.4),
    "nav-eye-middle.svg": (57.2, 873.9, 359.8, 424.9),
    "nav-eye-right.svg": (463.3, 1246.1, 369.5, 460.3),
}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for output_name, (source_name, box, options) in SINGLES.items():
        write_piece(source_name, output_name, box, **options)
    for output_name, box in CAMERAS.items():
        write_piece("05_cameras.svg", output_name, box)
    for output_name, box in INFO_MARKS.items():
        write_piece("06_i-cercles.svg", output_name, box)
    for output_name, box in POPUP_MARKS.items():
        write_piece("07_spirales-etoiles.svg", output_name, box)
    for output_name, box in EYES.items():
        write_piece("10_yeux-noirs_1.svg", output_name, box, rotate=True)
