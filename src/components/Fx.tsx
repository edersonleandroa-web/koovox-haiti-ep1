import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { H, W, rand } from "../lib/util";

const TILE = 1024;

/** Grão de filme animado (troca a cada 2 quadros — orgânico e ainda comprime bem). */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.075 }) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const r = rand(step * 7919 + 13);
  const i = step % 4;
  const ox = Math.floor(r() * TILE);
  const oy = Math.floor(r() * TILE);
  const tiles: React.ReactNode[] = [];
  for (let x = ox - TILE; x < W; x += TILE) {
    for (let y = oy - TILE; y < H; y += TILE) {
      if (x + TILE <= 0 || y + TILE <= 0) continue;
      tiles.push(
        <Img
          key={`${x}_${y}`}
          src={staticFile(`textures/grain-big-${i}.png`)}
          style={{ position: "absolute", left: x, top: y, width: TILE, height: TILE }}
        />,
      );
    }
  }
  return <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>{tiles}</AbsoluteFill>;
};

/** Vinheta fixa + respiração de luz muito sutil (projetor/lâmpada). */
export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const flick = 0.018 + 0.014 * Math.sin(frame * 0.37) * Math.sin(frame * 0.113 + 1.3);
  return (
    <>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${Math.max(0, flick)})`, pointerEvents: "none" }} />
    </>
  );
};

/**
 * Pré-carrega as texturas usadas por CSS (máscara do carimbo) com <Img> invisível: o Remotion só
 * fotografa o quadro depois que elas carregam.
 */
export const Preload: React.FC = () => (
  <div style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", pointerEvents: "none" }}>
    <Img src={staticFile("textures/stamp-mask.png")} style={{ width: 1, height: 1 }} />
  </div>
);
