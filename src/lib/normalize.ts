import type { ChapterData, Scene, TransitionType } from "../types";

const TYPES = new Set(["photo", "full", "person", "duo", "network", "map", "stat", "date", "timeline", "doc", "headline", "logo"]);
const TRANS = new Set(["whip", "zoom", "flash", "glitch", "fade", "cut"]);

/**
 * Deixa o JSON de cenas seguro para renderizar: ordena, torna contíguo (sem buracos nem
 * sobreposição), garante início em 0 e fim na duração do áudio + `pad`, e corrige campos ausentes.
 */
export const normalizeChapter = (raw: unknown, pad: number): ChapterData => {
  const d = raw as ChapterData;
  const duration = Number(d.duration) || 0;
  const list = (Array.isArray(d.scenes) ? d.scenes : [])
    .filter((s) => s && TYPES.has((s as Scene).type))
    .map((s) => ({ ...s }))
    .sort((a, b) => a.start - b.start) as Scene[];
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (i === 0) s.start = 0;
    const next = list[i + 1];
    s.end = next ? next.start : duration + pad;
    if (!s.transition || !TRANS.has(s.transition)) s.transition = (i === 0 ? "fade" : "whip") as TransitionType;
    if (!s.id) s.id = `${d.chapter}-${i + 1}`;
  }
  // cenas curtas demais (< 1 s) são absorvidas pela anterior
  const out: Scene[] = [];
  for (const s of list) {
    if (out.length && s.end - s.start < 1) {
      out[out.length - 1].end = s.end;
    } else {
      out.push(s);
    }
  }
  return { chapter: d.chapter, audio: d.audio, duration, scenes: out };
};
