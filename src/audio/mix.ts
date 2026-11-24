import { hash, sec } from "../lib/util";
import { ENDS_ON_LOGO, IS_CARD, SPEAKING, TIMELINE, TOTAL_FRAMES } from "../timeline";
import type { TransitionType } from "../types";

/*
 * Mixagem (volumes lineares do Remotion)
 *  - narração: 1.0 (sempre a camada mais alta)
 *  - música: 0,085 enquanto há narração; sobe para 0,22 só nos trechos sem voz que contêm o título,
 *    um cartão de capítulo ou o encerramento, com rampas de 20 quadros na subida e na descida
 *  - efeitos: no máximo 0,3, cada arquivo nivelado abaixo da voz
 */
export const VOICE_VOLUME = 1;
export const MUSIC_UNDER_VOICE = 0.085;
export const MUSIC_OPEN = 0.22;
export const MUSIC_RAMP = 20;
const GUARD = 4; // quadros de folga entre a fala e o início/fim de uma rampa

/** Ganho da música por quadro global. */
export const MUSIC_GAIN: Float32Array = (() => {
  const g = new Float32Array(TOTAL_FRAMES + 1).fill(MUSIC_UNDER_VOICE);
  let a = 0;
  while (a <= TOTAL_FRAMES) {
    if (SPEAKING[a]) {
      a++;
      continue;
    }
    let b = a;
    while (b < TOTAL_FRAMES && !SPEAKING[b + 1]) b++;
    let card = false;
    for (let f = a; f <= b && !card; f++) card = IS_CARD[f] === 1;
    const lo = a + GUARD;
    const hi = b - GUARD;
    if (card && hi - lo >= 2 * MUSIC_RAMP) {
      for (let f = lo; f <= hi; f++) {
        const k = Math.min(1, (f - lo) / MUSIC_RAMP, (hi - f) / MUSIC_RAMP);
        g[f] = MUSIC_UNDER_VOICE + (MUSIC_OPEN - MUSIC_UNDER_VOICE) * k;
      }
    }
    a = b + 1;
  }
  return g;
})();

/*
 * Efeitos sonoros: só onde a imagem tem um evento num quadro exato (transição de cena, número ou
 * título/logo que acende). Nada decorativo.
 * `hit` = quadro do arquivo em que o som chega ao corpo (1º quadro a até 6 dB do pico, medido);
 * esse quadro cai exatamente no quadro do evento. `len`/`fade` encerram o som junto com o evento.
 */
type Clip = { file: string; hit: number; len: number; fade: number; v: number };
type Kind = "whip" | "zoom" | "flash" | "glitch" | "hit" | "card";

const CLIPS: Record<Kind, Clip[]> = {
  // chicotada (SceneHost): a cena nova cruza a tela nos quadros 0–6 da transição
  whip: [
    { file: "sfx/whoosh_fast-1.mp3", hit: 7, len: 21, fade: 4, v: 0.12 },
    { file: "sfx/whoosh_fast-2.mp3", hit: 7, len: 19, fade: 3, v: 0.15 },
    { file: "sfx/whoosh_fast-3.mp3", hit: 6, len: 15, fade: 3, v: 0.25 },
  ],
  // zoom: troca de cena nos quadros 0–14
  zoom: [{ file: "sfx/whoosh_soft-2.mp3", hit: 9, len: 24, fade: 8, v: 0.3 }],
  // clarão: branco no quadro 0, some até o 9
  flash: [{ file: "sfx/flash-1.mp3", hit: 0, len: 10, fade: 5, v: 0.2 }],
  // falha digital: quadros 0–10
  glitch: [{ file: "sfx/glitch-2.mp3", hit: 0, len: 11, fade: 4, v: 0.2 }],
  // número (StatView) ou logo (LogoView) acendendo
  hit: [{ file: "sfx/boom-2.mp3", hit: 0, len: 45, fade: 12, v: 0.15 }],
  // título do episódio e cartões de capítulo (sem voz)
  card: [{ file: "sfx/boom-1.mp3", hit: 0, len: 120, fade: 24, v: 0.2 }],
};

const ENTRY: Partial<Record<TransitionType, Kind>> = { whip: "whip", zoom: "zoom", flash: "flash", glitch: "glitch" };

export type SfxEvent = { f: number; event: number; file: string; v: number; len: number; fade: number; what: string };

export const SFX_EVENTS: SfxEvent[] = (() => {
  const out: SfxEvent[] = [];
  const add = (event: number, kind: Kind, salt: number, what: string, room = Infinity) => {
    const list = CLIPS[kind];
    const c = list[Math.abs(salt) % list.length];
    const len = Math.min(c.len, c.hit + Math.max(c.fade + 1, room));
    out.push({ f: event - c.hit, event, file: c.file, v: c.v, len, fade: c.fade, what });
  };
  for (const seg of TIMELINE.segments) {
    if (seg.kind === "chapter") {
      seg.data.scenes.forEach((s, i) => {
        const from = seg.from + sec(s.start);
        const end = seg.from + sec(s.end);
        // transição de entrada; a 1ª cena do capítulo entra em fade sobre o cartão (sem som)
        const enter = s.transition ?? "whip";
        const kind = i === 0 ? undefined : ENTRY[enter];
        if (kind) add(from, kind, hash(s.id), `${s.id} · transição ${enter}`);
        // StatView: o número acende (neonOn) no quadro `at`
        if (s.type === "stat") {
          const ev = from + sec(s.label?.at ?? s.at ?? 0.35);
          add(ev, "hit", 0, `${s.id} · número`, end - ev);
        }
        // LogoView: o logo acende no quadro 4
        if (s.type === "logo") add(from + 4, "hit", 0, `${s.id} · logo`);
      });
    } else if (seg.kind === "card") {
      // ChapterCard: o título acende no quadro 14
      add(seg.from + 14, "card", 0, `cartão ${seg.key} · título`, seg.dur - 14);
    } else if (seg.kind === "title") {
      // TitleCard: "HAITÍ" acende no quadro 8
      add(seg.from + 8, "card", 0, "título do episódio", seg.dur - 8);
    } else if (seg.kind === "outro" && !ENDS_ON_LOGO) {
      // Outro: o logo acende no quadro 10 (se o capítulo final já terminou no logo, nada acende aqui)
      add(seg.from + 10, "card", 0, "encerramento · logo", seg.dur - 10);
    }
  }
  return out.filter((e) => e.f >= 0).sort((a, b) => a.f - b.f);
})();
