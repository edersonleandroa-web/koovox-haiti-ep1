import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import { TIMELINE } from "../timeline";
import { hash, sec } from "../lib/util";
import type { Scene } from "../types";

// Arquivos em public/sfx/<nome>-<n>.mp3 (pico normalizado em -3 dB). Variações por som:
const VARIANTS: Record<string, number> = {
  whoosh_fast: 3,
  whoosh_soft: 2,
  polaroid: 2,
  typewriter: 3,
  photo_slide: 2,
  tape: 2,
  thumbtack: 2,
  stamp: 2,
  boom: 2,
  glitch: 2,
  string_twang: 2,
  marker_circle: 2,
  riser: 2,
  folder_open: 2,
  map_unfold: 2,
  projector: 1,
  flash: 2,
  heartbeat: 1,
  slide_projector: 2,
};

// Volume base de cada categoria (a narração tem prioridade)
const BASE: Record<string, number> = {
  whoosh_fast: 0.2,
  whoosh_soft: 0.3,
  polaroid: 0.32,
  typewriter: 0.2,
  photo_slide: 0.4,
  tape: 0.3,
  thumbtack: 0.32,
  stamp: 0.4,
  boom: 0.42,
  glitch: 0.22,
  string_twang: 0.26,
  marker_circle: 0.26,
  riser: 0.26,
  folder_open: 0.32,
  map_unfold: 0.28,
  projector: 0.2,
  flash: 0.26,
  heartbeat: 0.45,
  slide_projector: 0.3,
};

type Ev = { f: number; file: string; v: number; len: number };

const file = (name: string, salt: number) => {
  const n = VARIANTS[name] ?? 1;
  return `sfx/${name}-${(salt % n) + 1}.mp3`;
};

const ev = (f: number, name: string, salt: number, mult = 1, lenS = 3): Ev | null =>
  VARIANTS[name] ? { f, file: file(name, salt), v: (BASE[name] ?? 0.3) * mult, len: sec(lenS) } : null;

const sceneEvents = (s: Scene, from: number, prev: Scene | undefined, idx: number): Ev[] => {
  const out: (Ev | null)[] = [];
  const h = hash(s.id) + idx;
  const at = (t: number) => from + sec(t);
  switch (s.transition) {
    case "whip":
      out.push(ev(from - 5, "whoosh_fast", h, 1, 2));
      break;
    case "zoom":
      out.push(ev(from - 4, "whoosh_soft", h, 1, 2));
      break;
    case "flash":
      out.push(ev(from - 2, "flash", h, 1, 2));
      break;
    case "glitch":
      out.push(ev(from, "glitch", h, 1, 2));
      break;
    default:
      break;
  }
  switch (s.type) {
    case "photo":
      out.push(ev(at(0.05), "photo_slide", h));
      if ((s.frame ?? "polaroid") === "polaroid") out.push(ev(at(0.3), "tape", h, 0.8, 1));
      break;
    case "person":
      out.push(ev(at(0), "polaroid", h));
      out.push(ev(at(0.55), "typewriter", h));
      break;
    case "duo": {
      const a0 = Math.min(0.35, s.items[0]?.at ?? 0.07);
      const a1 = Math.max(a0 + 0.27, s.items[1]?.at ?? a0 + 0.55);
      out.push(ev(at(a0), "photo_slide", h));
      out.push(ev(at(a1), "photo_slide", h + 1, 0.8));
      out.push(ev(at(a1 + 0.47), "string_twang", h));
      break;
    }
    case "network":
      s.items.slice(0, 5).forEach((it, k) => {
        if (k < 3) out.push(ev(at(k === 0 ? Math.min(0.35, it.at ?? 0.35) : it.at ?? 0.5 + k * 0.4), "photo_slide", h + k, 0.75));
      });
      out.push(ev(at((s.items[0]?.at ?? 0.5) + 0.3), "string_twang", h, 0.8));
      break;
    case "map":
      if (!prev || prev.type !== "map") out.push(ev(at(0), "map_unfold", h));
      (s.pins ?? []).slice(0, 4).forEach((p, k) => out.push(ev(at(p.at ?? 0.8), "thumbtack", h + k, 0.9, 1)));
      if (s.route) out.push(ev(at(s.route.at ?? 0.6), "whoosh_soft", h, 0.9, 2));
      if (s.shade) out.push(ev(at(s.shade.at ?? 1), "marker_circle", h, 0.9, 2));
      break;
    case "stat":
      out.push(ev(at(s.label?.at ?? s.at ?? 0.35), "boom", h, 0.5, 4));
      if (s.text) out.push(ev(at((s.label?.at ?? s.at ?? 0.35) + 0.75), "typewriter", h, 0.8));
      break;
    case "date":
      out.push(ev(at((s.label?.at ?? s.at ?? 0.3) + 0.08), "stamp", h));
      if (s.sub) out.push(ev(at((s.label?.at ?? s.at ?? 0.3) + 0.55), "typewriter", h, 0.7));
      break;
    case "timeline":
      out.push(ev(at(0.12), "string_twang", h));
      break;
    case "doc":
      out.push(ev(at(0.05), "folder_open", h));
      if (s.stamp) {
        const dur = s.end - s.start;
        out.push(ev(at(s.stampAt ?? Math.max(1.0, Math.min(2.2, dur * 0.4))), "stamp", h));
      }
      break;
    case "headline":
      out.push(ev(at(0.05), "photo_slide", h));
      out.push(ev(at(0.35), "thumbtack", h, 0.9, 1));
      break;
    case "logo":
      out.push(ev(at(0.1), "boom", h, 0.55, 4));
      break;
    default:
      break;
  }
  // rótulo datilografado
  if (s.label && s.type !== "stat" && s.type !== "date" && s.type !== "person") {
    const k = s.label.kind ?? "info";
    if (k === "place" || k === "name" || k === "info") out.push(ev(at(s.label.at ?? 0.5), "typewriter", h + 7, 0.8));
    else out.push(ev(at(s.label.at ?? 0.5), "stamp", h + 7, 0.45, 1));
  }
  // sons pedidos explicitamente no roteiro
  for (const x of s.sfx ?? []) {
    const base = x.name.replace(/-\d+$/, "");
    const e = ev(at(x.at ?? 0), base, h + 3, x.volume ?? 1);
    if (e) out.push(e);
  }
  return out.filter(Boolean) as Ev[];
};

const ALL: Ev[] = (() => {
  const list: Ev[] = [];
  for (const seg of TIMELINE.segments) {
    if (seg.kind === "chapter") {
      const sc = seg.data.scenes;
      sc.forEach((s, i) => {
        const from = seg.from + sec(s.start);
        // a 1ª cena do capítulo entra em fade sobre o cartão: sem whoosh
        const evs = sceneEvents(i === 0 ? { ...s, transition: "fade" } : s, from, sc[i - 1], i);
        list.push(...evs);
      });
    } else if (seg.kind === "card") {
      list.push({ f: seg.from + 6, file: "sfx/boom-1.mp3", v: 0.5, len: sec(4) });
      list.push({ f: seg.from + 2, file: "sfx/glitch-2.mp3", v: 0.12, len: sec(2) });
    } else if (seg.kind === "title") {
      list.push({ f: seg.from - sec(2.2), file: "sfx/riser-2.mp3", v: 0.24, len: sec(2.6) });
      list.push({ f: seg.from + 6, file: "sfx/boom-2.mp3", v: 0.6, len: sec(4) });
    } else if (seg.kind === "outro") {
      list.push({ f: seg.from + 8, file: "sfx/boom-2.mp3", v: 0.35, len: sec(4) });
    }
  }
  return list.filter((e) => e.f >= 0).sort((a, b) => a.f - b.f);
})();

export const SfxTrack: React.FC = () => (
  <>
    {ALL.map((e, i) => (
      <Sequence key={i} from={e.f} durationInFrames={e.len} name={`sfx ${e.file}`} layout="none">
        <Audio src={staticFile(e.file)} volume={e.v} />
      </Sequence>
    ))}
  </>
);

// exportado para conferência
export const SFX_COUNT = ALL.length;
