"""Importe les images livrées par Vania (`JONATHAN/`) vers `assets/`, prêtes pour le web.

Les dossiers sources sont des scans et des photos brutes : noms accentués, TIFF, orientations
EXIF, fichiers de 2 à 5 Mo. Ce script les normalise en une passe idempotente et ajoute les
nouvelles images aux listes de `content/`, que le CMS édite ensuite. Pour une image isolée,
le CMS suffit : il la dépose telle quelle et le build la prépare.

Deux tailles par image de galerie :
  · `nom.jpg`    — la version pleine, ouverte dans la lightbox (et en fond d'accueil)
  · `nom-t.jpg`  — la vignette du collage. Sans elle, la page Carnets chargerait 117 images
                   pleine résolution d'un coup.

Usage   : python tools/import-images.py
Sorties : assets/carnets/, assets/home/, assets/bio/portraits/
          content/carnets.json, accueil.json, aleas.json, bio.json (`portraits`) — complétés,
          jamais réécrits : les titres et l'ordre saisis dans le CMS sont conservés.
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
ASSETS = ROOT / "public" / "assets"

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


def existing(out):
    """Images déjà présentes avant l'import : elles ne sont pas « nouvelles »."""
    return {f"assets/{out}/{f.name}" for f in (ASSETS / out).glob("*.jpg")} if (ASSETS / out).exists() else set()


def merge(file, key, entries, item, before):
    """Complète une liste de `content/` sans écraser ce que le CMS y a édité.

    L'ordre et les titres saisis dans Sveltia priment : une image déjà listée garde sa
    place et son titre, une image dont le fichier a disparu sort de la liste, et seules les
    images vraiment nouvelles (absentes de `assets/` avant l'import) s'ajoutent à la fin.
    Une image que Vania a retirée dans le CMS ne revient donc pas au prochain import.
    Les ajouts faits depuis le CMS (assets/uploads/) sont gardés."""
    path = ROOT / "content" / file
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    first = key not in data
    current = data.get(key, [])
    src_of = lambda e: e["image"] if isinstance(e, dict) else e
    kept = [e for e in current if (ROOT / src_of(e)).exists()]
    known = {src_of(e) for e in kept}
    added = [item(e) for e in entries if e["src"] not in known and (first or e["src"] not in before)]
    data[key] = kept + added
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  content/{file} : {len(added)} ajoutée(s), {len(current) - len(kept)} retirée(s)")


if __name__ == "__main__":
    before = {job["out"]: existing(job["out"]) for job in JOBS}
    results = {job["out"]: run_job(job) for job in JOBS}
    merge("carnets.json", "carnets", results["carnets"],
          lambda e: {"image": e["src"], "titre": e.get("title", "")}, before["carnets"])
    merge("accueil.json", "photos", results["home"], lambda e: e["src"], before["home"])
    merge("bio.json", "portraits", results["bio/portraits"], lambda e: e["src"], before["bio/portraits"])

    # Les aléas sont détourés par tools/cutout-drawing.py, pas convertis ici : on se contente
    # de les inventorier s'ils sont déjà là, pour que les deux scripts restent indépendants.
    # Un aléa n'est ajouté qu'à son premier inventaire (liste absente) : ensuite, le CMS décide.
    aleas = sorted((ASSETS / "aleas").glob("alea-*.png")) if (ASSETS / "aleas").exists() else []
    merge("aleas.json", "aleas", [{"src": f"assets/aleas/{p.name}"} for p in aleas], lambda e: e["src"],
          {f"assets/aleas/{p.name}" for p in aleas})
