"""Rapatrie les vignettes des films Kinematik depuis Vimeo.

La page tirait ses miniatures de vumbnail.com, un service tiers : trois films sur douze en
revenaient noirs (une image de cadenas pour la vidéo privée, un aplat noir pour les autres),
alors que Vimeo a bien une vraie image pour chacun. On passe donc par l'API oEmbed officielle
— qui accepte le hash des vidéos non répertoriées — et on stocke les images dans le dépôt :
plus de dépendance externe au chargement de la page, et un poster corrigeable à la main.

La liste des films est lue dans waniushka-components.jsx pour ne pas la tenir à deux endroits.

Usage   : python tools/fetch-thumbs.py
Sorties : assets/kinematik/{id}.jpg
"""

import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageStat

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "design-extract" / "site-minimalist-portoflio" / "project" / "waniushka-components.jsx"
OUT = ROOT / "public" / "assets" / "kinematik"
UA = {"User-Agent": "Mozilla/5.0"}
WIDTH = 1280

# En-dessous, l'image est un aplat : c'est le symptôme qui a motivé ce script.
FLAT_STDDEV = 12


def films():
    """Les entrées de KINEMATIK, lues dans le fichier de data (id, vimeoId, hash)."""
    src = DATA.read_text(encoding="utf-8")
    block = re.search(r"const KINEMATIK = \[(.*?)\n\];", src, re.S).group(1)
    out = []
    for line in block.splitlines():
        ids = re.search(r"id: '([^']+)'", line)
        vid = re.search(r"vimeoId: '([^']+)'", line)
        if not (ids and vid):
            continue
        h = re.search(r"hash: '([^']+)'", line)
        out.append({"id": ids.group(1), "vimeo": vid.group(1), "hash": h.group(1) if h else None})
    return out


def thumbnail_url(film):
    """URL de la vraie miniature via oEmbed. Le hash est requis pour les vidéos privées."""
    page = f"https://vimeo.com/{film['vimeo']}"
    if film["hash"]:
        page += f"/{film['hash']}"
    q = "https://vimeo.com/api/oembed.json?width={w}&url={u}".format(
        w=WIDTH, u=urllib.parse.quote(page, safe=""))
    req = urllib.request.Request(q, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["thumbnail_url"]


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    flat = []
    for film in films():
        try:
            url = thumbnail_url(film)
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
        except Exception as e:
            print(f"  ⚠ {film['id']} : {e!r}")
            continue
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        dest = OUT / f"{film['id']}.jpg"
        img.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        sd = ImageStat.Stat(img.convert("L")).stddev[0]
        if sd < FLAT_STDDEV:
            flat.append(film["id"])
        print(f"  {dest.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  contraste={sd:.0f}")

    if flat:
        print(f"\n⚠ vignette encore uniforme pour : {', '.join(flat)} — poster à changer sur Vimeo")
    else:
        print("\nles 12 vignettes ont une vraie image")
