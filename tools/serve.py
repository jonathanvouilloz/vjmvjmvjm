"""Serveur de prévisualisation, avec support des requêtes Range.

`python -m http.server` ignore l'en-tête `Range` et renvoie toujours le fichier entier :
le navigateur ne peut alors pas se déplacer dans un MP3 qu'il n'a pas fini de télécharger,
et tout saut avant/arrière ramène la lecture à zéro. Ça n'arrive qu'en local — Netlify,
comme tout serveur statique sérieux, répond 206 — mais ça rend le player intestable.

Usage : python tools/serve.py [port] [dossier]
        défauts : 8123, racine du projet (le build de travail). Passer `dist` pour
        vérifier le build de déploiement.
"""

import re
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        header = self.headers.get("Range")
        if not header:
            return super().send_head()

        path = self.translate_path(self.path)
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404)
            return None

        size = Path(path).stat().st_size
        m = re.match(r"bytes=(\d*)-(\d*)", header)
        start, end = m.group(1), m.group(2)
        start = int(start) if start else 0
        end = int(end) if end else size - 1
        end = min(end, size - 1)
        if start > end:
            f.close()
            self.send_error(416)
            return None

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        f.seek(start)
        # SimpleHTTPRequestHandler copie le fichier jusqu'à sa fin : on ne lui laisse
        # lire que la tranche demandée.
        return _Slice(f, end - start + 1)

    def log_message(self, *args):
        pass


class _Slice:
    """Vue tronquée d'un fichier ouvert, refermée avec lui."""

    def __init__(self, f, length):
        self.f, self.left = f, length

    def read(self, n=-1):
        if self.left <= 0:
            return b""
        chunk = self.f.read(self.left if n < 0 else min(n, self.left))
        self.left -= len(chunk)
        return chunk

    def close(self):
        self.f.close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    root = (ROOT / sys.argv[2]) if len(sys.argv) > 2 else ROOT
    handler = partial(RangeHandler, directory=str(root))
    print(f"http://localhost:{port}/index.html  ({root})")
    HTTPServer(("", port), handler).serve_forever()
