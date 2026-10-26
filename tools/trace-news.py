"""Vectorise le « NEWS ↓ » manuscrit (JONATHAN/Sigles/NEWS/news.png) → public/assets/brand/news-scroll.svg.

Le scan est petit (321×229) : on l'agrandit ×6 avant le seuil pour que Potrace suive des
courbes lisses plutôt que les marches de pixels. Usage : pip install potracer ; python tools/trace-news.py
"""

from pathlib import Path
import numpy as np
import potrace
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "JONATHAN" / "Sigles" / "NEWS" / "news.png"
OUT = ROOT / "public" / "assets" / "brand" / "news-scroll.svg"
SCALE = 6

img = Image.open(SRC).convert("L")
img = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS).filter(ImageFilter.GaussianBlur(SCALE / 2))
ink = np.array(img) < 128
ys, xs = np.nonzero(ink)
assert len(xs), "aucun trait détecté"
pad = 4 * SCALE
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad

# potracer remplit les pixels False : on lui passe donc le papier, pas l'encre
path = potrace.Bitmap(~ink[y0:y1, x0:x1]).trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.2)
f = lambda p: f"{p.x:.1f} {p.y:.1f}"
d = []
for curve in path:
    d.append(f"M{f(curve.start_point)}")
    for seg in curve.segments:
        d.append(f"L{f(seg.c)}L{f(seg.end_point)}" if seg.is_corner else f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
    d.append("Z")
OUT.write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1 - x0} {y1 - y0}">'
    f'<path fill="#000" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n',
    encoding="utf-8",
)
print(OUT.relative_to(ROOT), f"{x1 - x0}×{y1 - y0}")
