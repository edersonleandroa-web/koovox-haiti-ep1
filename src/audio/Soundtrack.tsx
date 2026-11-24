import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import { TIMELINE, TOTAL_FRAMES } from "../timeline";
import { MUSIC_GAIN, MUSIC_UNDER_VOICE } from "./mix";

/** Trilhas: ganho por quadro (mix.ts) × fade de entrada e de saída de cada trilha — nada entra ou corta seco. */
export const Soundtrack: React.FC = () => (
  <>
    {TIMELINE.music.map((m, i) => {
      // a última trilha termina o fade exatamente no fim do filme
      const dur = Math.min(m.dur, TOTAL_FRAMES - m.from);
      return (
        <Sequence key={i} from={m.from} durationInFrames={dur} name={`música ${m.src}`}>
          <Audio
            src={staticFile(m.src)}
            loop
            volume={(f) => {
              const g = MUSIC_GAIN[Math.min(TOTAL_FRAMES, m.from + f)] ?? MUSIC_UNDER_VOICE;
              const fin = Math.min(1, f / Math.max(1, m.fadeIn));
              const fout = Math.min(1, (dur - 1 - f) / Math.max(1, m.fadeOut));
              return Math.max(0, g * fin * fout);
            }}
          />
        </Sequence>
      );
    })}
  </>
);
