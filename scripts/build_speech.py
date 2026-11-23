"""Gera src/data/speech.json: intervalos de fala por capítulo (para abaixar a música sob a voz).

uso: py scripts/build_speech.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TR = os.path.join(ROOT, "data", "transcripts")
MAP = {"intro": "Intro", "c1": "1", "c2": "2", "c3": "3", "final": "Final"}
GAP = 0.45  # pausas menores que isso contam como fala contínua

out = {}
for key, name in MAP.items():
    p = os.path.join(TR, name + ".json")
    if not os.path.exists(p):
        continue
    d = json.load(open(p, encoding="utf-8"))
    words = [(w["s"], w["e"]) for seg in d["segments"] for w in seg["words"]]
    if not words:
        words = [(seg["start"], seg["end"]) for seg in d["segments"]]
    words.sort()
    merged = []
    for s, e in words:
        if merged and s - merged[-1][1] <= GAP:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    out[key] = [[round(s, 2), round(e, 2)] for s, e in merged]
    print(key, len(merged), "trechos de fala")

with open(os.path.join(ROOT, "src", "data", "speech.json"), "w", encoding="utf-8") as fh:
    json.dump(out, fh)
