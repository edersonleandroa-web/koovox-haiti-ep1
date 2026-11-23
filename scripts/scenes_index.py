"""Gera src/data/scenes/index.ts importando os JSONs de cenas que existem (os que faltam viram um
capítulo-esboço de 10 s, só para poder testar o filme antes de todos os roteiros ficarem prontos).

uso: py scripts/scenes_index.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DIR = os.path.join(ROOT, "src", "data", "scenes")
KEYS = ["intro", "c1", "c2", "c3", "final"]
AUDIO = {"intro": "audio/intro.mp3", "c1": "audio/1.mp3", "c2": "audio/2.mp3", "c3": "audio/3.mp3", "final": "audio/final.mp3"}

lines = ["// Gerado por scripts/scenes_index.py — não editar à mão.", ""]
missing = []
for k in KEYS:
    if os.path.exists(os.path.join(DIR, f"{k}.json")):
        lines.append(f'import {k} from "./{k}.json";')
    else:
        missing.append(k)
        lines.append(
            f"const {k} = "
            + json.dumps(
                {
                    "chapter": k,
                    "audio": AUDIO[k],
                    "duration": 10,
                    "scenes": [{"id": f"{k}-esboco", "start": 0, "end": 10, "type": "date", "text": "EM BREVE", "transition": "fade"}],
                },
                ensure_ascii=False,
            )
            + ";"
        )
lines += ["", f"export const SCENES: Record<string, unknown> = {{ {', '.join(KEYS)} }};", ""]
open(os.path.join(DIR, "index.ts"), "w", encoding="utf-8").write("\n".join(lines))
print("faltando:", missing or "nenhum")
