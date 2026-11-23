import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import { IS_CARD, SPEAKING, TIMELINE, TOTAL_FRAMES } from "../timeline";

// Narração ~ -21,6 dB médio; trilhas ~ -14,3 dB médio.
const UNDER_VOICE = 0.085; // ~14 dB abaixo da voz
const IN_PAUSE = 0.16;
const ON_CARD = 0.3;
const RAMP = 10; // quadros para subir/descer

/** Ganho da música por quadro global: abaixa sob a voz, sobe nas pausas e nos cartões. */
const GAIN: Float32Array = (() => {
  const target = new Float32Array(TOTAL_FRAMES + 1);
  for (let f = 0; f <= TOTAL_FRAMES; f++) {
    target[f] = IS_CARD[f] ? ON_CARD : SPEAKING[f] ? UNDER_VOICE : IN_PAUSE;
  }
  // pausas curtas (< 0,8 s) não sobem a música — evita "bombear"
  const out = new Float32Array(TOTAL_FRAMES + 1);
  for (let f = 0; f <= TOTAL_FRAMES; f++) {
    let v = target[f];
    if (v === IN_PAUSE) {
      let a = f;
      let b = f;
      while (a > 0 && target[a - 1] === IN_PAUSE) a--;
      while (b < TOTAL_FRAMES && target[b + 1] === IN_PAUSE) b++;
      if (b - a < 24) v = UNDER_VOICE;
    }
    out[f] = v;
  }
  // suavização (média móvel)
  const sm = new Float32Array(TOTAL_FRAMES + 1);
  let acc = 0;
  const win: number[] = [];
  for (let f = 0; f <= TOTAL_FRAMES; f++) {
    win.push(out[f]);
    acc += out[f];
    if (win.length > RAMP) acc -= win.shift() as number;
    sm[f] = acc / win.length;
  }
  return sm;
})();

export const Soundtrack: React.FC = () => (
  <>
    {TIMELINE.music.map((m, i) => (
      <Sequence key={i} from={m.from} durationInFrames={m.dur} name={`música ${m.src}`}>
        <Audio
          src={staticFile(m.src)}
          loop
          volume={(f) => {
            const g = GAIN[Math.min(TOTAL_FRAMES, m.from + f)] ?? UNDER_VOICE;
            const fin = Math.min(1, f / Math.max(1, m.fadeIn));
            const fout = Math.min(1, (m.dur - f) / Math.max(1, m.fadeOut));
            return Math.max(0, g * fin * fout);
          }}
        />
      </Sequence>
    ))}
  </>
);
