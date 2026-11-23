import React from "react";
import { Composition, Folder } from "remotion";
import { Film, FilmSlice } from "./Film";
import { FPS, H, W } from "./lib/util";
import { TIMELINE, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Haiti" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Folder name="Previas">
      {TIMELINE.segments
        .filter((s) => s.kind === "chapter")
        .map((s) => (
          <Composition
            key={s.kind === "chapter" ? s.key : "x"}
            id={`Prev-${s.kind === "chapter" ? s.key : "x"}`}
            component={FilmSlice}
            defaultProps={{ from: Math.max(0, s.from - 120) }}
            durationInFrames={s.dur + 240}
            fps={FPS}
            width={W}
            height={H}
          />
        ))}
    </Folder>
  </>
);
