import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import { SFX_EVENTS } from "./mix";

/** Efeitos sonoros: só transições e elementos que acendem num quadro exato (lista e volumes em mix.ts). */
export const SfxTrack: React.FC = () => (
  <>
    {SFX_EVENTS.map((e, i) => (
      <Sequence key={i} from={e.f} durationInFrames={e.len} name={`sfx ${e.what}`} layout="none">
        <Audio src={staticFile(e.file)} volume={(f) => e.v * Math.max(0, Math.min(1, (e.len - 1 - f) / e.fade))} />
      </Sequence>
    ))}
  </>
);

// exportado para conferência
export const SFX_COUNT = SFX_EVENTS.length;
