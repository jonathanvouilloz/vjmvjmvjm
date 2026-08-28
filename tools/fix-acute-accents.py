"""
Learning Curve (Blue Vinyl Fonts) dessine TOUS ses accents aigus comme des graves :
« é » sort « è », « emporté » se lit « emportè ». Inutilisable tel quel en français.

Les glyphes sont des contours simples (l'accent est fondu dans le dessin de la lettre,
pas un composant réutilisé), donc on ne peut pas juste repointer un composant :
il faut retoucher l'outline. Ce script isole le contour de l'accent (le plus haut du
glyphe) et le retourne horizontalement — un grave miroité donne un aigu crédible,
dans le même trait manuscrit que le reste de la police.

Usage :
    python tools/fix-acute-accents.py

Entrée  : assets/fonts/LearningCurve.ttf        (original, jamais modifié)
Sortie  : assets/fonts/LearningCurve-fr.ttf     (celui que le site charge)
"""

from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "fonts" / "LearningCurve.ttf"
DST = ROOT / "assets" / "fonts" / "LearningCurve-fr.ttf"

ACUTE_GLYPHS = [
    "acute",
    "aacute", "eacute", "iacute", "oacute", "uacute", "yacute",
    "Aacute", "Eacute", "Iacute", "Oacute", "Uacute", "Yacute",
]


def contours(glyph):
    """Découpe le glyphe en tranches [start, end] d'indices de points, une par contour."""
    spans, start = [], 0
    for end in glyph.endPtsOfContours:
        spans.append((start, end))
        start = end + 1
    return spans


def mirror_accent(glyph):
    """Retourne horizontalement le contour le plus haut. True si retouché."""
    if glyph.numberOfContours <= 0:  # vide ou composite
        return False

    spans = contours(glyph)
    if len(spans) < 2 and glyph.numberOfContours != 1:
        return False

    coords = glyph.coordinates
    flags = glyph.flags

    # L'accent = le contour dont le point le plus bas est le plus haut de tous.
    # (Sur « acute » isolé il n'y a qu'un seul contour, la règle tient quand même.)
    def floor_of(span):
        s, e = span
        return min(coords[i][1] for i in range(s, e + 1))

    s, e = max(spans, key=floor_of)

    xs = [coords[i][0] for i in range(s, e + 1)]
    axis = min(xs) + max(xs)  # miroir autour du centre du contour, il ne bouge pas
    for i in range(s, e + 1):
        x, y = coords[i]
        coords[i] = (axis - x, y)

    # Le miroir inverse le sens d'enroulement : on remet le contour à l'endroit,
    # sinon TrueType le traite comme un trou et l'accent disparaît.
    span_pts = [coords[i] for i in range(s, e + 1)][::-1]
    span_flags = [flags[i] for i in range(s, e + 1)][::-1]
    for offset, i in enumerate(range(s, e + 1)):
        coords[i] = span_pts[offset]
        flags[i] = span_flags[offset]

    return True


def main():
    font = TTFont(SRC)
    glyf = font["glyf"]
    known = set(font.getGlyphOrder())

    done, missing = [], []
    for name in ACUTE_GLYPHS:
        if name not in known:
            missing.append(name)
            continue
        glyph = glyf[name]
        if mirror_accent(glyph):
            glyph.recalcBounds(glyf)
            done.append(name)

    font.save(DST)
    print(f"{len(done)} glyphes corriges -> {DST.name}")
    print("  " + " ".join(done))
    if missing:
        print("  absents de la police :", " ".join(missing))


if __name__ == "__main__":
    main()
