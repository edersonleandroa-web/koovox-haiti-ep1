"""Folhas de revisão: um quadro do meio de cada cena (e dos cartões), por capítulo, com legenda.

uso: py scripts/review_sheets.py <video.mp4> [pasta_saida=out/review]
Reproduz a mesma conta de tempo de src/timeline.ts (PAD, cartões, sobreposições).
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FPS = 30
PAD = 0.8
TITLE, CARD, OUTRO = round(5.5 * FPS), round(3.6 * FPS), round(4 * FPS)
CARD_IN, CH_IN = 10, 18
KEYS = ["intro", "c1", "c2", "c3", "final"]
TYPES = {"photo", "full", "person", "duo", "network", "map", "stat", "date", "timeline", "doc", "headline", "logo"}


def sec(s):
    return round(s * FPS)


def normalize(d):
    dur = float(d["duration"])
    sc = sorted([dict(s) for s in d["scenes"] if s.get("type") in TYPES], key=lambda s: s["start"])
    for i, s in enumerate(sc):
        if i == 0:
            s["start"] = 0
        s["end"] = sc[i + 1]["start"] if i + 1 < len(sc) else dur + PAD
    out = []
    for s in sc:
        if out and s["end"] - s["start"] < 1:
            out[-1]["end"] = s["end"]
        else:
            out.append(s)
    return dur, out


def build():
    items = []  # (key, id, frame, legenda)
    cursor = 0
    for i, k in enumerate(KEYS):
        d = json.load(open(os.path.join(ROOT, "src", "data", "scenes", f"{k}.json"), encoding="utf-8"))
        dur, scenes = normalize(d)
        if k != "intro":
            card_from = max(0, cursor - CARD_IN)
            items.append((k, f"{k}-cartao", card_from + CARD // 2, "CARTÃO DE CAPÍTULO"))
            cursor = card_from + CARD - CH_IN
        ch_from = cursor
        for s in scenes:
            mid = ch_from + sec((s["start"] + s["end"]) / 2)
            lab = s.get("label") or {}
            txt = " / ".join(x for x in [lab.get("text"), lab.get("sub")] if x)
            extra = s.get("name") or s.get("text") or s.get("headline") or s.get("title") or ""
            items.append((k, s["id"], mid, f"{s['type']} {s.get('transition','')} | {txt or extra}"))
        end = ch_from + sec(dur + PAD)
        if i == 0:
            t_from = end - CARD_IN
            items.append((k, "titulo", t_from + TITLE // 2, "TÍTULO"))
            end = t_from + TITLE
        if i == len(KEYS) - 1:
            o_from = end - CARD_IN
            items.append((k, "encerramento", o_from + OUTRO // 2, "ENCERRAMENTO"))
            end = o_from + OUTRO
        cursor = end
    return items, cursor


def main():
    video = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "out", "review")
    os.makedirs(out, exist_ok=True)
    items, total = build()
    print("total de quadros calculado:", total)
    try:
        font = ImageFont.truetype("arial.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    by_cap = {}
    for k, sid, f, cap in items:
        p = os.path.join(out, f"{sid}.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / FPS:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=480:-2", p], check=False)
        by_cap.setdefault(k, []).append((sid, f, cap, p))
    for k, lst in by_cap.items():
        cols, w, h, th = 4, 480, 270, 40
        rows = (len(lst) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w, rows * (h + th)), (20, 20, 20))
        d = ImageDraw.Draw(sheet)
        for i, (sid, f, cap, p) in enumerate(lst):
            x, y = (i % cols) * w, (i // cols) * (h + th)
            if os.path.exists(p):
                sheet.paste(Image.open(p).resize((w, h)), (x, y))
            d.text((x + 6, y + h + 3), f"{sid} @{f / FPS:6.1f}s", fill=(255, 210, 120), font=font)
            d.text((x + 6, y + h + 21), cap[:62], fill=(230, 230, 230), font=font)
        sheet.save(os.path.join(out, f"_folha-{k}.jpg"), quality=80)
        print("folha", k, len(lst), "quadros")


if __name__ == "__main__":
    main()
