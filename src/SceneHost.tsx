import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneProvider } from "./components/SceneCtx";
import { EASE_IN, EASE_OUT, H, W, hash, prog, rand } from "./lib/util";
import { DocView, DuoView, HeadlineView, LogoView, NetworkView, PersonView, PhotoView } from "./scenes/BoardScenes";
import { DateView, FullView, StatView, TimelineView } from "./scenes/GraphicScenes";
import { MapSceneView } from "./scenes/MapScene";
import type { Scene, TransitionType } from "./types";

/** Quadros que a cena ANTERIOR continua visível por baixo durante a entrada desta transição. */
export const overlapFrames = (t: TransitionType | undefined) => {
  switch (t) {
    case "whip":
      return 12;
    case "zoom":
      return 14;
    case "fade":
      return 18;
    case "glitch":
      return 3;
    default:
      return 0; // cut, flash
  }
};

export const whipDir = (index: number) => (index % 2 === 0 ? 1 : -1);

const SceneBody: React.FC<{ s: Scene }> = ({ s }) => {
  switch (s.type) {
    case "photo":
      return <PhotoView s={s} />;
    case "full":
      return <FullView s={s} />;
    case "person":
      return <PersonView s={s} />;
    case "duo":
      return <DuoView s={s} />;
    case "network":
      return <NetworkView s={s} />;
    case "map":
      return <MapSceneView s={s} />;
    case "stat":
      return <StatView s={s} />;
    case "date":
      return <DateView s={s} />;
    case "timeline":
      return <TimelineView s={s} />;
    case "doc":
      return <DocView s={s} />;
    case "headline":
      return <HeadlineView s={s} />;
    case "logo":
      return <LogoView />;
    default:
      return null;
  }
};

/** Desfoque direcional (motion blur da chicotada) via filtro SVG com id único. */
const HBlur: React.FC<{ id: string; amount: number }> = ({ id, amount }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-10%" y="0%" width="120%" height="100%">
      <feGaussianBlur stdDeviation={`${amount} 0`} />
    </filter>
  </svg>
);

/**
 * Hospeda uma cena: aplica a transição de ENTRADA (a própria) e a de SAÍDA (a da próxima cena)
 * durante a cauda de sobreposição. A próxima cena é desenhada por cima.
 */
export const SceneHost: React.FC<{
  s: Scene;
  index: number;
  dur: number;
  exit?: TransitionType;
  exitDir: number;
}> = ({ s, index, dur, exit, exitDir }) => {
  const frame = useCurrentFrame();
  const seed = hash(s.id);
  const enter = s.transition ?? "whip";
  const dir = whipDir(index);
  let tx = 0;
  let sc = 1;
  let op = 1;
  let blur = 0;
  let flash = 0;
  let glitch = 0;

  // entrada
  const inT = overlapFrames(enter);
  if (enter === "whip" && frame < inT) {
    const p = prog(frame, 0, inT, EASE_OUT);
    tx = dir * W * 0.85 * (1 - p);
    blur = 28 * (1 - p);
  } else if (enter === "zoom" && frame < inT) {
    const p = prog(frame, 0, inT, EASE_OUT);
    sc = interpolate(p, [0, 1], [0.9, 1]);
    op = p;
  } else if (enter === "fade" && frame < inT) {
    op = prog(frame, 0, inT);
  } else if (enter === "flash") {
    flash = interpolate(frame, [0, 2, 9], [0.85, 0.55, 0], { extrapolateRight: "clamp" });
  } else if (enter === "glitch" && frame < 10) {
    glitch = 1 - frame / 10;
  }

  // saída (durante a entrada da próxima cena)
  if (frame >= dur && exit) {
    const outT = overlapFrames(exit);
    const p = outT > 0 ? prog(frame, dur, dur + outT, EASE_IN) : 1;
    if (exit === "whip") {
      tx += -exitDir * W * 0.85 * p;
      blur = Math.max(blur, 28 * p);
    } else if (exit === "zoom") {
      sc *= interpolate(p, [0, 1], [1, 1.35]);
    }
  }

  const r = rand(seed + Math.floor(frame / 1));
  const jit = glitch > 0 ? (r() - 0.5) * 60 * glitch : 0;
  const blurId = `hb-${seed}`;
  const body = (
    <SceneProvider value={{ dur, index, seed }}>
      <SceneBody s={s} />
    </SceneProvider>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {blur > 0.5 ? <HBlur id={blurId} amount={blur} /> : null}
      <AbsoluteFill
        style={{
          transform: `translate3d(${tx + jit}px, 0, 0) scale(${sc})`,
          opacity: op,
          filter: blur > 0.5 ? `url(#${blurId})` : glitch > 0 ? `saturate(${1 + glitch}) contrast(${1 + glitch * 0.4})` : undefined,
        }}
      >
        {body}
      </AbsoluteFill>
      {glitch > 0 ? (
        <>
          {[0, 1].map((k) => {
            const top = Math.floor(r() * 80);
            const hgt = 4 + Math.floor(r() * 14);
            return (
              <AbsoluteFill
                key={k}
                style={{
                  clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - hgt)}% 0)`,
                  transform: `translateX(${(k ? -1 : 1) * (30 + r() * 70) * glitch}px)`,
                  filter: `hue-rotate(${k ? 160 : -40}deg) saturate(2)`,
                  opacity: 0.9,
                }}
              >
                <SceneProvider value={{ dur, index, seed }}>
                  <SceneBody s={s} />
                </SceneProvider>
              </AbsoluteFill>
            );
          })}
          <AbsoluteFill
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              opacity: glitch,
            }}
          />
        </>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(255,250,240,${flash})` }} /> : null}
      {/* pequeno respiro de altura para a sombra do whip não mostrar borda */}
      <div style={{ position: "absolute", width: W, height: H, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
