import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SfxTrack } from "./audio/Sfx";
import { Soundtrack } from "./audio/Soundtrack";
import { Grain, Preload, Vignette } from "./components/Fx";
import { prog, sec } from "./lib/util";
import { ChapterCard, Outro, TitleCard } from "./scenes/Cards";
import { SceneHost, overlapFrames, whipDir } from "./SceneHost";
import { ENDS_ON_LOGO, EPISODE, TIMELINE } from "./timeline";
import type { ChapterData } from "./types";

const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: prog(frame, 0, frames) }}>{children}</AbsoluteFill>;
};

const ChapterView: React.FC<{ data: ChapterData }> = ({ data }) => (
  <>
    {data.scenes.map((s, i) => {
      const from = sec(s.start);
      const dur = Math.max(1, sec(s.end) - from);
      const next = data.scenes[i + 1];
      const tail = next ? overlapFrames(next.transition) : 0;
      return (
        <Sequence key={s.id} from={from} durationInFrames={dur + tail} name={`${s.id} · ${s.type}`}>
          <SceneHost s={s} index={i} dur={dur} exit={next?.transition} exitDir={whipDir(i + 1)} />
        </Sequence>
      );
    })}
  </>
);

/** O filme inteiro: capítulos (narração + cenas), cartões, trilha, efeitos e acabamento. */
export const Film: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
    {TIMELINE.segments.map((seg, i) => {
      if (seg.kind === "chapter") {
        return (
          <Sequence key={i} from={seg.from} durationInFrames={seg.dur + 20} name={`capítulo ${seg.key}`}>
            <ChapterView data={seg.data} />
            <Audio src={staticFile(seg.data.audio)} />
          </Sequence>
        );
      }
      if (seg.kind === "card") {
        return (
          <Sequence key={i} from={seg.from} durationInFrames={seg.dur} name={`cartão ${seg.key}`}>
            <FadeIn frames={10}>
              <ChapterCard number={seg.number} title={seg.title} dur={seg.dur} />
            </FadeIn>
          </Sequence>
        );
      }
      if (seg.kind === "title") {
        return (
          <Sequence key={i} from={seg.from} durationInFrames={seg.dur} name="título">
            <FadeIn frames={10}>
              <TitleCard title={EPISODE.title} sub={EPISODE.sub} kicker={EPISODE.kicker} dur={seg.dur} />
            </FadeIn>
          </Sequence>
        );
      }
      return (
        <Sequence key={i} from={seg.from} durationInFrames={seg.dur} name="encerramento">
          <FadeIn frames={10}>
            <Outro dur={seg.dur} continueLogo={ENDS_ON_LOGO} />
          </FadeIn>
        </Sequence>
      );
    })}
    <Soundtrack />
    <SfxTrack />
    <Vignette />
    <Grain />
    <Preload />
  </AbsoluteFill>
);

/** Prévia de um trecho do filme (desloca o filme inteiro para começar no quadro `from`). */
export const FilmSlice: React.FC<{ from: number }> = ({ from }) => (
  <Sequence from={-from} layout="none">
    <Film />
  </Sequence>
);
