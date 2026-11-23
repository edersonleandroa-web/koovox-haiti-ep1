"""Gera src/data/cutouts.json: proporção (largura/altura) de cada recorte PNG usado nas cenas,
para a cena de pessoa recortada posicionar figura e anel sem precisar medir a imagem no render.

uso: py scripts/build_cutouts_meta.py
"""
import glob
import json
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
meta = {}
for p in glob.glob(os.path.join(ROOT, "public", "media", "*", "*-recorte.png")):
    w, h = Image.open(p).size
    rel = os.path.relpath(p, os.path.join(ROOT, "public")).replace("\\", "/")
    meta[rel] = round(w / h, 4)
json.dump(meta, open(os.path.join(ROOT, "src", "data", "cutouts.json"), "w", encoding="utf-8"), indent=2)
print(meta)
