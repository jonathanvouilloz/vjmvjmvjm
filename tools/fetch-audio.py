"""Récupère les vrais épisodes sonores depuis les partages kDrive de Vania et les prépare
pour le web.

Les masters sont des WAV 44,1 kHz / 24 bits de 150 à 970 Mo — inutilisables tels quels.
On télécharge, on encode en MP3 mono 96 kbps (de la parole, pas de la musique) et on relève
la durée réelle : les durées affichées sur le site étaient jusqu'ici inventées.

Les liens de partage sont publics ; l'API répond sans jeton :
    /2/app/{driveId}/share/{shareId}/files/{fileId}/files     → listing JSON
    /2/app/{driveId}/share/{shareId}/files/{fileId}/download  → le fichier

Usage   : python tools/fetch-audio.py
Sorties : assets/audio/{album}/{n}.mp3 + le récapitulatif des durées à reporter dans ALBUMS
"""

import json
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio"
CACHE = ROOT / ".audio-cache"          # les sources brutes, hors build (jamais copiées en prod)

DRIVE = 1049875
API = "https://kdrive.infomaniak.com/2/app/{drive}/share/{share}/files/{fid}/{verb}"
UA = {"User-Agent": "Mozilla/5.0"}

# 64 kbps mono : c'est de la parole, pas de la musique. À 96 kbps les deux épisodes de
# « Mourir c'est pas si grave » pesaient 40 Mo pièce et faisaient à eux seuls les deux tiers
# du site. On perd dans les ambiances et les nappes sonores, pas dans l'intelligibilité.
BITRATE = "64k"

# Un album → son partage et le sous-dossier à préférer. `prefer_dir` évite de tirer
# un master WAV d'un giga quand un MP3 du même épisode existe à côté.
ALBUMS = [
    {
        "id": "mourir",
        "share": "359e27cb-9d7c-4745-a96c-2aa1265e5c88",
        "root": 20456,
        "prefer_dir": "Mourir c'est pas si grave_MP3",
    },
    {
        "id": "chronique",
        "share": "62fb7d29-6c29-4ddb-9a62-61d2e52809cf",
        "root": 8759,
        "prefer_dir": None,
    },
]


def api(share, fid, verb="files"):
    url = API.format(drive=DRIVE, share=share, fid=fid, verb=verb)
    req = urllib.request.Request(url, headers={**UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["data"]


def download(share, fid, dest, size):
    """Télécharge en reprenant sur octet manquant : les masters font jusqu'à 1 Go."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size == size:
        print(f"    (déjà en cache) {dest.name}")
        return
    url = API.format(drive=DRIVE, share=share, fid=fid, verb="download")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        done = 0
        while chunk := r.read(1 << 20):
            f.write(chunk)
            done += len(chunk)
            print(f"    {dest.name} {done / 1e6:6.1f} / {size / 1e6:.1f} Mo", end="\r")
    print()


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def encode(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
         "-ac", "1", "-b:a", BITRATE, "-map_metadata", "-1", str(dest)],
        check=True,
    )


def sort_key(name):
    """Ordre des épisodes, insensible à la casse et aux accents.

    Vania nomme ses masters à la main : « épisode 1 » en minuscules accentuées côtoie
    « EPISODE 2 ». Un tri brut sur la chaîne mettait l'épisode 1 en dernier.
    """
    return unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()


def collect(share, fid, prefer_dir):
    """Fichiers audio d'un partage — le sous-dossier préféré l'emporte s'il existe."""
    entries = api(share, fid)
    if prefer_dir:
        for e in entries:
            if e["type"] == "dir" and e["name"] == prefer_dir:
                return [x for x in api(share, e["id"]) if x["type"] == "file"]
    return [e for e in entries if e["type"] == "file"]


if __name__ == "__main__":
    summary = {}
    for album in ALBUMS:
        print(f"{album['id']} :")
        files = sorted(collect(album["share"], album["root"], album["prefer_dir"]),
                       key=lambda e: sort_key(e["name"]))
        tracks = []
        for i, f in enumerate(files, 1):
            raw = CACHE / album["id"] / f["name"]
            download(album["share"], f["id"], raw, f["size"])
            mp3 = OUT / album["id"] / f"{i}.mp3"
            print(f"    encodage → {mp3.relative_to(ROOT)}")
            encode(raw, mp3)
            sec = round(duration(mp3))
            tracks.append({
                "n": i,
                "file": f["name"],
                "src": f"assets/audio/{album['id']}/{i}.mp3",
                "sec": sec,
                "duration": f"{sec // 60}:{sec % 60:02d}",
                "mo": round(mp3.stat().st_size / 1e6, 1),
            })
        summary[album["id"]] = tracks

    print("\n── à reporter dans ALBUMS ──")
    for aid, tracks in summary.items():
        print(f"{aid} : {len(tracks)} épisode(s)")
        for t in tracks:
            print(f"  {t['n']}. {t['duration']}  sec={t['sec']}  {t['mo']} Mo  ← {t['file']}")
