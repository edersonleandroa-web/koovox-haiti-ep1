import { getLength } from "@remotion/paths";
import React, { useMemo } from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { EASE_OUT, prog } from "../lib/util";

/** Fio vermelho entre dois pontos, com barriga (sag), desenhado como traço (nunca fade). */
export const RedString: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  at: number;
  dur?: number;
  sag?: number;
  width?: number;
}> = ({ x1, y1, x2, y2, at, dur = 16, sag = 40, width = 3.2 }) => {
  const frame = useCurrentFrame();
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const len = useMemo(() => getLength(d), [d]);
  const p = prog(frame, at, at + dur, EASE_OUT);
  if (p <= 0) return null;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} stroke="rgba(0,0,0,0.45)" strokeWidth={width + 1.5} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} transform="translate(3 6)" />
      <path d={d} stroke="#B8211A" strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      <path d={d} stroke="rgba(255,140,120,0.35)" strokeWidth={1} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} transform="translate(0 -0.8)" />
    </svg>
  );
};

/** Carimbo de tinta vermelha que bate no papel (escala 1.6 → 1 em 5 quadros) com textura gasta. */
export const Stamp: React.FC<{ text: string; at: number; size?: number; rot?: number }> = ({ text, at, size = 64, rot = -9 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = prog(frame, at, at + 5, EASE_OUT);
  const s = interpolate(p, [0, 1], [1.6, 1]);
  return (
    <div
      style={{
        display: "inline-block",
        transform: `rotate(${rot}deg) scale(${s})`,
        opacity: interpolate(p, [0, 0.4, 1], [0, 0.9, 0.86]),
        border: `${size * 0.08}px solid ${C.red}`,
        borderRadius: size * 0.12,
        padding: `${size * 0.08}px ${size * 0.3}px`,
        color: C.red,
        fontFamily: FONT.cond,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.08em",
        lineHeight: 1.05,
        textTransform: "uppercase",
        // a máscara é pré-carregada por <Preload> (Fx.tsx) com <Img>
        // eslint-disable-next-line @remotion/no-background-image
        WebkitMaskImage: `url(${staticFile("textures/stamp-mask.png")})`,
        WebkitMaskSize: "260px 260px",
        mixBlendMode: "multiply",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Linhas de texto datilografado "ilegíveis" (barras), para documentos sem poluir com texto falso. */
export const TypedLines: React.FC<{ n: number; width: number; seed: number; at: number; gap?: number }> = ({ n, width, seed, at, gap = 26 }) => {
  const frame = useCurrentFrame();
  const lines = [];
  for (let i = 0; i < n; i++) {
    const w = width * (0.55 + (((seed * 9301 + i * 49297) % 233280) / 233280) * 0.45);
    const p = prog(frame, at + i * 2, at + i * 2 + 10);
    lines.push(
      <div key={i} style={{ height: 9, width: w * p, backgroundColor: "rgba(40,36,30,0.55)", borderRadius: 2, marginBottom: gap - 9 }} />,
    );
  }
  return <div>{lines}</div>;
};
