import { getLength } from "@remotion/paths";
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
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
