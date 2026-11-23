import { SCENES } from "./data/scenes";
import speechRaw from "./data/speech.json";
import { normalizeChapter } from "./lib/normalize";
import { FPS, sec } from "./lib/util";
import type { ChapterData } from "./types";

/** Respiro no fim de cada capítulo antes do cartão seguinte (s). */
export const PAD = 0.8;
export const TITLE_DUR = sec(5.5);
export const CARD_DUR = sec(3.6);
export const OUTRO_DUR = sec(4);
const CARD_IN = 10; // o cartão entra por cima do fim do capítulo (fade)
const CH_IN = 18; // o capítulo entra por cima do fim do cartão (fade da 1ª cena)

export const EPISODE = {
  kicker: "KOOVOX APRESENTA",
  title: "HAITI",
  sub: "Como as gangues chegaram ao poder",
};

type ChapterDef = { key: string; raw: unknown; number?: string; title?: string; music: { src: string; at: number }[] };

// Títulos curtos e factuais dos capítulos (cartões entre os áudios)
const DEFS: ChapterDef[] = [
  { key: "intro", raw: SCENES.intro, music: [{ src: "music/intro.mp3", at: 0 }] },
  { key: "c1", raw: SCENES.c1, number: "CAPÍTULO 1", title: "As raízes das gangues", music: [{ src: "music/c1.mp3", at: 0 }] },
  { key: "c2", raw: SCENES.c2, number: "CAPÍTULO 2", title: "Política, armas e caos", music: [{ src: "music/c2a.mp3", at: 0 }, { src: "music/c2b.mp3", at: 164 }] },
  { key: "c3", raw: SCENES.c3, number: "CAPÍTULO 3", title: "O dinheiro das gangues", music: [{ src: "music/c3a.mp3", at: 0 }, { src: "music/c3b.mp3", at: 146 }] },
  { key: "final", raw: SCENES.final, number: "CAPÍTULO FINAL", title: "O preço da violência", music: [{ src: "music/final.mp3", at: 0 }] },
];

export type Segment =
  | { kind: "chapter"; key: string; from: number; dur: number; data: ChapterData }
  | { kind: "card"; key: string; from: number; dur: number; number: string; title: string }
  | { kind: "title"; from: number; dur: number }
  | { kind: "outro"; from: number; dur: number };

export type MusicCue = { src: string; from: number; dur: number; fadeIn: number; fadeOut: number };

const build = () => {
  const segments: Segment[] = [];
  const music: MusicCue[] = [];
  let cursor = 0;
  DEFS.forEach((def, i) => {
    const data = normalizeChapter(def.raw, PAD);
    let musicFrom = cursor;
    if (def.number && def.title) {
      const cardFrom = Math.max(0, cursor - CARD_IN);
      segments.push({ kind: "card", key: def.key, from: cardFrom, dur: CARD_DUR, number: def.number, title: def.title });
      musicFrom = cardFrom;
      cursor = cardFrom + CARD_DUR - CH_IN;
    }
    const dur = sec(data.duration + PAD);
    segments.push({ kind: "chapter", key: def.key, from: cursor, dur, data });
    const chapterEnd = cursor + dur;
    let end = chapterEnd;
    if (i === 0) {
      const tFrom = chapterEnd - CARD_IN;
      segments.push({ kind: "title", from: tFrom, dur: TITLE_DUR });
      end = tFrom + TITLE_DUR;
    }
    if (i === DEFS.length - 1) {
      const oFrom = chapterEnd - CARD_IN;
      segments.push({ kind: "outro", from: oFrom, dur: OUTRO_DUR });
      end = oFrom + OUTRO_DUR;
    }
    // trilhas do capítulo (encadeadas com crossfade)
    def.music.forEach((m, k) => {
      const from = musicFrom + sec(m.at);
      const nextAt = def.music[k + 1]?.at;
      const until = Math.min(end + sec(0.5), nextAt !== undefined ? musicFrom + sec(nextAt) + sec(4) : end + sec(0.5));
      if (until - from < sec(2)) return; // trilha começaria depois do fim do capítulo
      music.push({ src: m.src, from, dur: until - from, fadeIn: k === 0 ? sec(1.2) : sec(4), fadeOut: sec(nextAt !== undefined ? 4 : 2.5) });
    });
    cursor = end;
  });
  return { segments, music, total: cursor };
};

export const TIMELINE = build();

/** O capítulo final termina numa cena de logo? (o encerramento então só segura o logo e escurece) */
export const ENDS_ON_LOGO = (() => {
  const last = [...TIMELINE.segments].reverse().find((s) => s.kind === "chapter");
  return last?.kind === "chapter" && last.data.scenes[last.data.scenes.length - 1]?.type === "logo";
})();
export const TOTAL_FRAMES = TIMELINE.total;

/** Fala (s) por capítulo → para cada quadro global, se o narrador está falando. */
const speech = speechRaw as unknown as Record<string, [number, number][]>;

export const SPEAKING: Uint8Array = (() => {
  const arr = new Uint8Array(TOTAL_FRAMES + 1);
  for (const seg of TIMELINE.segments) {
    if (seg.kind !== "chapter") continue;
    for (const [s, e] of speech[seg.key] ?? []) {
      const a = seg.from + Math.floor(s * FPS);
      const b = seg.from + Math.ceil(e * FPS);
      for (let f = Math.max(0, a); f <= Math.min(TOTAL_FRAMES, b); f++) arr[f] = 1;
    }
  }
  return arr;
})();

/** Quadros de cartão/título/encerramento (música sobe). */
export const IS_CARD: Uint8Array = (() => {
  const arr = new Uint8Array(TOTAL_FRAMES + 1);
  for (const seg of TIMELINE.segments) {
    if (seg.kind === "chapter") continue;
    for (let f = seg.from + 8; f < Math.min(TOTAL_FRAMES, seg.from + seg.dur - 6); f++) arr[f] = 1;
  }
  return arr;
})();
