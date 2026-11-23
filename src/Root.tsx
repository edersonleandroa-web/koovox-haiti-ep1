import React from "react";
import { Composition, Folder } from "remotion";
import { Film, FilmSlice } from "./Film";
import { MAP_H, MAP_W, MapBase } from "./scenes/MapScene";
import { FPS, H, W } from "./lib/util";
import { TIMELINE, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Haiti" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="MapBase" component={MapBase} defaultProps={{ view: "haiti" as const }} durationInFrames={1} fps={FPS} width={MAP_W} height={MAP_H} />
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
