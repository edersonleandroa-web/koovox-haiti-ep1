import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useScene } from "../components/SceneCtx";
import { rand } from "../lib/util";

/**
 * Câmera do mural: push-in lento e linear (1 → 1+push) com deriva lateral. Nunca para — mesmo
 * num "hold" o quadro respira. Continua durante a cauda da transição de saída.
 */
export const Cam: React.FC<{
  children: React.ReactNode;
  push?: number;
  drift?: number;
  origin?: [number, number];
}> = ({ children, push = 0.045, drift = 18, origin = [0.5, 0.5] }) => {
  const frame = useCurrentFrame();
  const { dur, seed } = useScene();
  const t = Math.min(1.35, frame / Math.max(1, dur));
  const r = rand(seed * 13 + 5);
  const dx = (r() < 0.5 ? -1 : 1) * drift * t;
  const dy = (r() < 0.5 ? -1 : 1) * drift * 0.45 * t;
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(${1 + push * t})`,
        transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`,
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Escurecimento radial atrás de um texto sobre foto/vídeo (legibilidade sem caixa). */
export const TextShade: React.FC<{ x: number; y: number; w?: number; h?: number; strength?: number }> = ({
  x,
  y,
  w = 900,
  h = 260,
  strength = 0.55,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength * 0.6}) 45%, rgba(0,0,0,0) 100%)`,
      pointerEvents: "none",
    }}
  />
);
