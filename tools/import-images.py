"""Importe les images livrées par Vania (`JONATHAN/`) vers `assets/`, prêtes pour le web.

Les dossiers sources sont des scans et des photos brutes : noms accentués, TIFF, orientations
EXIF, fichiers de 2 à 5 Mo. Ce script les normalise en une passe idempotente et écrit le
fichier de data généré que le bundle consomme.

Deux tailles par image de galerie :
  · `nom.jpg`    — la version pleine, ouverte dans la lightbox (et en fond d'accueil)
  · `nom-t.jpg`  — la vignette du collage. Sans elle, la page Carnets chargerait 117 images
                   pleine résolution d'un coup.

Usage   : python tools/import-images.py
Sorties : assets/carnets/, assets/home/, assets/bio/portraits/
          design-extract/site-minimalist-portoflio/project/waniushka-assets.jsx
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

# La console Windows est en cp1252 : sans ça, le premier nom accentué affiché fait planter
# le script au lieu de convertir les images.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "JONATHAN"
ASSETS = ROOT / "assets"
GENERATED = ROOT / "design-extract" / "site-minimalist-portoflio" / "project" / "waniushka-assets.jsx"

THUMB = 700       # côté long des vignettes de collage
QUALITY = 82

# Un dossier source → un dossier cible.
#   full  : côté long de la version pleine
#   thumb : génère aussi une vignette `-t`
#   titles: expose un titre (les carnets sont légendés, les photos non)
JOBS = [
    {"src": "CARNETS DE BORD", "out": "carnets", "full": 1280, "thumb": True, "titles": True},
    {"src": "Photos pour PAGE D'ACCUEIL", "out": "home", "full": 1920, "thumb": True, "titles": False},
    {"src": "Autoportraits pour bio", "out": "bio/portraits", "full": 1200, "thumb": False, "titles": False},
]

# Les noms de fichiers font office de titres, mais certains sont abîmés (majuscule
# fantôme d'un double appui, accent perdu, séparateurs techniques). Corrections ciblées ;
# une valeur vide = l'image n'a pas de titre et s'affiche sans légende.
TITLE_FIXES = {
    "A vos dés ordres": "À vos dés ordres",
    "COca-cola": "Coca-cola",
    "FLamenco": "Flamenco",
    "RAge": "Rage",
    "Rage_2": "Rage",
    "pueposeless": "Purposeless",
    "Socrates_Ody_Orphée": "Socrate, Ody, Orphée",
    "Trébuche_Chute_Crise_Gravité": "Trébuche, chute, crise, gravité",
    "Scan 13.01 13": "",
    "Scan 14.01.13": "",
}

EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def slug(name):
    """Nom de fichier ASCII, stable et lisible, dérivé du titre d'origine."""
    flat = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    flat = re.sub(r"[^a-zA-Z0-9]+", "-", flat).strip("-").lower()
    return flat or "sans-titre"


def title_of(stem):
    if stem in TITLE_FIXES:
        return TITLE_FIXES[stem]
    clean = stem.replace("_", " ").strip()
    return clean[:1].upper() + clean[1:]


def convert(src, dest, max_side):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    scale = max_side / max(img.size)
    if scale < 1:
        img = img.resize((round(img.size[0] * scale), round(img.size[1] * scale)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return img.size


def run_job(job):
    src_dir = SRC / job["src"]
    out_dir = ASSETS / job["out"]
    print(f"{job['src']} → assets/{job['out']}")

    # Le script est propriétaire de son dossier : on repart à vide pour qu'un fichier
    # retiré côté source disparaisse aussi côté site.
    if out_dir.exists():
        for f in out_dir.glob("*.jpg"):
            f.unlink()
    out_dir.mkdir(parents=True, exist_ok=True)

    entries = []
    files = sorted(p for p in src_dir.iterdir() if p.suffix.lower() in EXTENSIONS)
    for path in files:
        name = slug(path.stem)
        full = out_dir / f"{name}.jpg"
        w, h = convert(path, full, job["full"])
        entry = {
            "id": name,
            "src": f"assets/{job['out']}/{name}.jpg",
            "w": w,
            "h": h,
        }
        if job["thumb"]:
            convert(path, out_dir / f"{name}-t.jpg", THUMB)
            entry["thumb"] = f"assets/{job['out']}/{name}-t.jpg"
        if job["titles"]:
            t = title_of(path.stem)
            if t:
                entry["title"] = t
        entries.append(entry)

    total = sum(f.stat().st_size for f in out_dir.glob("*.jpg"))
    print(f"  {len(entries)} images, {round(total / 1e6, 1)} Mo")
    return entries


def emit(data):
    """Écrit le fichier de data généré, concaténé au bundle par precompile.mjs."""
    body = ",\n".join(f"  {k}: {json.dumps(v, ensure_ascii=False)}" for k, v in data.items())
    GENERATED.write_text(
        "/* waniushka-assets.jsx — GÉNÉRÉ par tools/import-images.py, ne pas éditer à la main.\n"
        "   Inventaire des images de `assets/`, avec dimensions réelles (les vignettes Kinematik\n"
        "   et le collage s'en servent pour ne pas déformer) et titres tirés des noms de fichiers. */\n"
        f"Object.assign(window, {{\n{body},\n}});\n",
        encoding="utf-8",
    )
    print(f"  {GENERATED.relative_to(ROOT)}")


if __name__ == "__main__":
    data = {}
    for job in JOBS:
        key = {"carnets": "CARNETS_SRC", "home": "HOME_SRC", "bio/portraits": "PORTRAITS_SRC"}[job["out"]]
        data[key] = run_job(job)

    # Les aléas sont détourés par tools/cutout-drawing.py, pas convertis ici : on se contente
    # de les inventorier s'ils sont déjà là, pour que les deux scripts restent indépendants.
    aleas = sorted((ASSETS / "aleas").glob("alea-*.png")) if (ASSETS / "aleas").exists() else []
    data["ALEAS_SRC"] = [f"assets/aleas/{p.name}" for p in aleas]
    print(f"aléas déjà détourés : {len(aleas)}")

    emit(data)
