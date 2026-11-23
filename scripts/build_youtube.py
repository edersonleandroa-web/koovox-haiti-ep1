"""Gera YOUTUBE.md: título, descrição em espanhol, capítulos (tempos reais da linha do tempo) e
atribuições das imagens/vídeos sob Creative Commons (as de domínio público não exigem atribuição).

uso: py scripts/build_youtube.py
"""
import glob
import importlib.util
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
spec = importlib.util.spec_from_file_location("rs", os.path.join(ROOT, "scripts", "review_sheets.py"))
rs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rs)

items, total = rs.build()
FPS = 30
CARD = round(3.6 * FPS)
NAMES = {
    "c1": "Capítulo 1 — Las raíces de las pandillas",
    "c2": "Capítulo 2 — Política, armas y caos",
    "c3": "Capítulo 3 — El dinero de las pandillas",
    "final": "Capítulo final — El precio de la violencia",
}
marks = [("0:00", "Introducción")]
for k, sid, f, cap in items:
    if sid.endswith("-cartao"):
        t = int((f - CARD // 2) / FPS)
        marks.append((f"{t // 60}:{t % 60:02d}", NAMES[k]))

used = set()
for p in glob.glob(os.path.join(ROOT, "src", "data", "scenes", "*.json")):
    def walk(o):
        if isinstance(o, dict):
            for key in ("src", "cutout"):
                if isinstance(o.get(key), str):
                    used.add(o[key].replace("\\", "/"))
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(json.load(open(p, encoding="utf-8")))

attrib = []
seen = set()
for p in sorted(glob.glob(os.path.join(ROOT, "data", "credits", "*.json"))):
    for it in json.load(open(p, encoding="utf-8")):
        f = str(it.get("file", "")).replace("\\", "/")
        f = f[f.index("media/"):] if "media/" in f else f
        if used and f not in used:
            continue
        lic = str(it.get("license", ""))
        if "CC" in lic.upper() and "CC0" not in lic.upper():
            key = (it.get("author"), it.get("source"))
            if key in seen:
                continue
            seen.add(key)
            attrib.append(f"- {it.get('author', '')} — {lic} — {it.get('source', '')}")

lines = [
    "# YouTube — HAITÍ (KOOVOX)",
    "",
    "## Título (sugerencias)",
    "",
    "- HAITÍ: cómo las pandillas llegaron al poder | Documental",
    "- Haití, el país tomado por las pandillas (Episodio 1)",
    "",
    "## Descripción",
    "",
    "En los últimos días, El Salvador ha librado combates muy duros en Haití. Antes de hablar de esa operación, "
    "en este primer episodio repasamos cómo llegó Haití a este punto: de los Tontons Macoutes de Duvalier al G9, "
    "Viv Ansanm y las pandillas que hoy controlan más del 80% de Puerto Príncipe.",
    "",
    "### Capítulos",
    "",
    *[f"{t} {n}" for t, n in marks],
    "",
    "### Imágenes y videos",
    "",
    "Material de dominio público de Voice of America (VOA / VOA Kreyòl), DVIDS y del Departamento de Defensa de "
    "EE. UU., USAID, U.S. Navy, U.S. Air Force, CBP e Internet Archive (Prelinger). Imágenes bajo licencias "
    "Creative Commons (ver atribuciones abajo). Música y efectos generados con Magnific. Mapas: Natural Earth "
    "(dominio público) y geoBoundaries (OpenStreetMap, ODbL; FEWS NET, CC BY 4.0).",
    "",
    "Atribuciones (Creative Commons):",
    *attrib,
    "",
    f"Duración total: {int(total / FPS) // 60}:{int(total / FPS) % 60:02d}",
    "",
]
open(os.path.join(ROOT, "YOUTUBE.md"), "w", encoding="utf-8").write("\n".join(lines))
print("YOUTUBE.md ok —", len(marks), "capítulos,", len(attrib), "atribuciones CC")
