"""Extrai quadros de revisão do vídeo renderizado: 2 por cena (35% e 85% da cena) em pastas por
capítulo, com um index.json (id, tipo, tempo, textos de tela) para os revisores.

uso: py scripts/review_frames.py <video.mp4> [pasta=out/review]
"""
import json
import os
import subprocess
import sys
import importlib.util

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
spec = importlib.util.spec_from_file_location("rs", os.path.join(ROOT, "scripts", "review_sheets.py"))
rs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rs)

FPS = 30


def texts(s):
    out = []
    lab = s.get("label") or {}
    for k in ("text", "sub"):
        if lab.get(k):
            out.append(f"label.{k}: {lab[k]}")
    for k in ("name", "role", "years", "text", "sub", "title", "stamp", "headline", "date", "caption", "link", "center", "prefix", "suffix"):
        if isinstance(s.get(k), str) and s.get(k).strip():
            out.append(f"{k}: {s[k]}")
    for i, it in enumerate(s.get("items") or []):
        out.append(f"items[{i}].name: {it.get('name')}")
    for i, p in enumerate(s.get("pins") or []):
        out.append(f"pins[{i}].name: {p.get('name')}")
    if (s.get("route") or {}).get("label"):
        out.append(f"route.label: {s['route']['label']}")
    for i, y in enumerate(s.get("years") or []):
        if isinstance(y, dict):
            out.append(f"years[{i}]: {y.get('year')} {y.get('text', '')}")
    return out


def main():
    video = sys.argv[1]
    base = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "out", "review")
    keys = ["intro", "c1", "c2", "c3", "final"]
    # tempos globais de cada cena
    cursor = 0
    index = {k: [] for k in keys}
    for i, k in enumerate(keys):
        d = json.load(open(os.path.join(ROOT, "src", "data", "scenes", f"{k}.json"), encoding="utf-8"))
        dur, scenes = rs.normalize(d)
        if k != "intro":
            card_from = max(0, cursor - rs.CARD_IN)
            cursor = card_from + rs.CARD - rs.CH_IN
        ch_from = cursor
        for s in scenes:
            a = ch_from + rs.sec(s["start"])
            b = ch_from + rs.sec(s["end"])
            index[k].append({
                "id": s["id"], "type": s["type"], "start_s": round(a / FPS, 2), "end_s": round(b / FPS, 2),
                "chapter_start_s": round(s["start"], 2), "chapter_end_s": round(s["end"], 2),
                "texts": texts(s), "media": (s.get("media") or {}).get("src"),
                "frames": [f"{s['id']}_a.jpg", f"{s['id']}_b.jpg"],
                "_fa": a + int((b - a) * 0.35), "_fb": a + int((b - a) * 0.85),
            })
        end = ch_from + rs.sec(dur + rs.PAD)
        if i == 0:
            end = end - rs.CARD_IN + rs.TITLE
        if i == len(keys) - 1:
            end = end - rs.CARD_IN + rs.OUTRO
        cursor = end
    for k in keys:
        d = os.path.join(base, k)
        os.makedirs(d, exist_ok=True)
        for it in index[k]:
            for tag, f in (("a", it["_fa"]), ("b", it["_fb"])):
                out = os.path.join(d, f"{it['id']}_{tag}.jpg")
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / FPS:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "4", out], check=False)
            it.pop("_fa")
            it.pop("_fb")
        json.dump(index[k], open(os.path.join(d, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(k, len(index[k]), "cenas")


if __name__ == "__main__":
    main()
