"""Empaquette `dist/` en `waniushka-netlify.zip` comme livrable de transport.

Le contenu de `dist/` est placé à la racine du zip (Netlify sert la racine telle quelle).
Pour une archive dépassant environ 50 Mo, préférer Netlify CLI au glisser-déposer.

Les JPEG, PNG et MP3 sont stockés sans compression : ils sont déjà compressés, les
redéflater coûte des minutes pour quelques dixièmes de pour cent — et le site pèse
maintenant l'essentiel de son poids en audio.

À lancer APRÈS `node precompile.mjs --prod`.

Usage : python tools/package-netlify.py
"""

import os
import sys
import zipfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "waniushka-netlify.zip"

ALREADY_COMPRESSED = {".jpg", ".jpeg", ".png", ".gif", ".mp3", ".mp4", ".woff", ".woff2"}


if __name__ == "__main__":
    if not (DIST / "index.html").exists():
        sys.exit("dist/index.html absent — lancer `node precompile.mjs --prod` d'abord.")

    files = sorted(p for p in DIST.rglob("*") if p.is_file())
    raw = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in files:
            mode = (zipfile.ZIP_STORED if p.suffix.lower() in ALREADY_COMPRESSED
                    else zipfile.ZIP_DEFLATED)
            z.write(p, p.relative_to(DIST).as_posix(), compress_type=mode)
            raw += p.stat().st_size

    print(f"{OUT.name} : {len(files)} fichiers, "
          f"{raw / 1e6:.1f} Mo bruts → {OUT.stat().st_size / 1e6:.1f} Mo")

    if OUT.stat().st_size > 50e6:
        print("  ⚠ archive > 50 Mo : préférer `npx netlify-cli deploy --prod --dir=dist`")

    # Netlify refuse les fichiers individuels au-delà de 100 Mo hors Large Media.
    gros = [p for p in files if p.stat().st_size > 100e6]
    for p in gros:
        print(f"  ⚠ {p.relative_to(DIST)} fait {p.stat().st_size / 1e6:.0f} Mo (> 100 Mo)")
