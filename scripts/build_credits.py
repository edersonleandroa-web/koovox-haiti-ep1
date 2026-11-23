"""Gera CREDITS.md a partir de data/credits/*.json (fotos e vídeos de terceiros) + trilhas/efeitos.

uso: py scripts/build_credits.py
"""
import glob
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ORDER = ["intro", "c1", "c2", "c3", "final"]
NAMES = {"intro": "Introdução", "c1": "Capítulo 1", "c2": "Capítulo 2", "c3": "Capítulo 3", "final": "Capítulo final"}

used = set()
for p in glob.glob(os.path.join(ROOT, "src", "data", "scenes", "*.json")):
    d = json.load(open(p, encoding="utf-8"))

    def walk(o):
        if isinstance(o, dict):
            if isinstance(o.get("src"), str):
                used.add(o["src"].replace("\\", "/"))
            if isinstance(o.get("cutout"), str):
                used.add(o["cutout"].replace("\\", "/"))
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(d)

lines = [
    "# Créditos",
    "",
    "## Fotos e vídeos (licenças livres)",
    "",
    "Todas as imagens e vídeos de terceiros abaixo estão em domínio público ou sob licenças Creative Commons",
    "que permitem uso comercial (CC0, CC BY, CC BY-SA). Para a descrição do YouTube, copie esta lista.",
    "",
]
seen = set()
for key in ORDER:
    p = os.path.join(ROOT, "data", "credits", f"{key}.json")
    if not os.path.exists(p):
        continue
    items = json.load(open(p, encoding="utf-8"))
    rows = []
    for it in items:
        f = str(it.get("file", "")).replace("\\", "/")
        f = f[f.index("media/"):] if "media/" in f else f
        if used and f not in used:
            continue
        k = (it.get("source"), f)
        if k in seen:
            continue
        seen.add(k)
        rows.append(
            f"| {os.path.basename(f)} | {str(it.get('title', '')).replace('|', '/')} | {str(it.get('author', '')).replace('|', '/')} | {it.get('license', '')} | {it.get('source', '')} |"
        )
    if rows:
        lines += [f"### {NAMES[key]}", "", "| Arquivo | Título | Autor | Licença | Fonte |", "|---|---|---|---|---|", *rows, ""]

lines += [
    "## Trilhas e efeitos sonoros",
    "",
    "- Trilhas: geradas no **Magnific** (Google Lyria 3 Pro; a do capítulo final com ElevenLabs Music v2).",
    "- Efeitos sonoros: gerados no **Magnific** (ElevenLabs SFX).",
    "",
    "## Mapas",
    "",
    "- Países: Natural Earth (domínio público), via `world-atlas`.",
    "- Departamentos do Haiti: geoBoundaries / OpenStreetMap (ODbL 1.0). Comunas: geoBoundaries / FEWS NET (CC BY 4.0).",
    "",
    "## Fontes tipográficas",
    "",
    "- Special Elite, Oswald e Permanent Marker — Google Fonts (SIL Open Font License).",
    "",
]
open(os.path.join(ROOT, "CREDITS.md"), "w", encoding="utf-8").write("\n".join(lines))
print("CREDITS.md:", len(seen), "itens")
