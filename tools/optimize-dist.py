"""Optimise les copies de publication sans modifier les médias canoniques.

Le build copie d'abord `assets/` vers `dist/assets/`. Ce script réencode uniquement les MP3
de `dist` pour la diffusion web. Les masters sous `assets/` restent donc inchangés et chaque
build repart de la même source canonique.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
AUDIO_DIR = DIST / "assets" / "audio"
AUDIO_BITRATE = "48k"
MAX_DURATION_DELTA = 0.25


def require(command):
    if not shutil.which(command):
        raise SystemExit(f"{command} absent — impossible d'optimiser l'audio de publication")


def duration(path):
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def optimize_audio(path):
    before_size = path.stat().st_size
    before_duration = duration(path)
    temporary = path.with_name(f".{path.stem}.web.mp3")
    temporary.unlink(missing_ok=True)

    try:
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(path), "-vn", "-map_metadata", "-1",
                "-codec:a", "libmp3lame", "-b:a", AUDIO_BITRATE,
                "-ac", "1", str(temporary),
            ],
            check=True,
        )
        after_duration = duration(temporary)
        duration_delta = abs(after_duration - before_duration)
        if duration_delta > MAX_DURATION_DELTA:
            raise RuntimeError(
                f"durée altérée pour {path.name}: {duration_delta:.3f} s"
            )

        after_size = temporary.stat().st_size
        if after_size >= before_size:
            temporary.unlink()
            return before_size, before_size

        os.replace(temporary, path)
        return before_size, after_size
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    require("ffmpeg")
    require("ffprobe")
    if not AUDIO_DIR.exists():
        raise SystemExit("dist/assets/audio absent — lancer le build de production d'abord")

    files = sorted(AUDIO_DIR.rglob("*.mp3"))
    before = after = 0
    for audio in files:
        old_size, new_size = optimize_audio(audio)
        before += old_size
        after += new_size
        print(
            f"  {audio.relative_to(DIST)}: "
            f"{old_size / 1e6:.2f} → {new_size / 1e6:.2f} Mo"
        )

    print(
        f"audio web {AUDIO_BITRATE}: {before / 1e6:.2f} → {after / 1e6:.2f} Mo "
        f"(-{(before - after) / 1e6:.2f} Mo)"
    )
