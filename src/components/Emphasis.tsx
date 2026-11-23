import React, { useMemo } from "react";
import { Easing, useCurrentFrame } from "remotion";
import { EASE_OUT, prog, rand } from "../lib/util";

/**
 * Marca-texto: faixa vermelha translúcida, de bordas irregulares, que passa por trás do texto da
 * esquerda para a direita (substitui a linha embaixo do texto — pedido do usuário).
 */
export const Highlight: React.FC<{ at: number; dur?: number; color?: string; children: React.ReactNode }> = ({
  at,
  dur = 10,
  color = "rgba(201,35,27,0.66)",
  children,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur, Easing.out(Easing.quad));
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: "-0.22em",
          right: "-0.22em",
          top: "0.08em",
          bottom: "-0.02em",
          backgroundColor: color,
          transform: `rotate(-1deg) scaleX(${p})`,
          transformOrigin: "0% 50%",
          clipPath: "polygon(0% 10%, 2% 0%, 30% 4%, 62% 0%, 98% 5%, 100% 0%, 99% 90%, 97% 100%, 70% 95%, 35% 100%, 3% 96%, 0% 100%)",
        }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

/**
 * Círculo à mão em volta da palavra/número: elipse irregular de ~1,08 volta, desenhada como traço
 * (stroke-dashoffset), em vermelho neon leve.
 */
export const CircleMark: React.FC<{
  at: number;
  dur?: number;
  seed?: number;
  padX?: number; // % da largura do conteúdo, para cada lado
  padY?: number; // % da altura do conteúdo, para cada lado
  width?: number; // espessura do traço (px)
  children: React.ReactNode;
}> = ({ at, dur = 16, seed = 3, padX = 14, padY = 26, width = 5, children }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur, EASE_OUT);
  const r0 = rand(seed);
  const a0 = -2.5 + r0() * 0.5; // ângulo inicial do traço (rad, sentido horário na tela)
  const d = useMemo(() => {
    const r = rand(seed + 1);
    const turns = 1.08;
    const n = 72;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = a0 + t * turns * Math.PI * 2;
      const wob = 1 + 0.025 * Math.sin(t * 11 + r()) + (r() - 0.5) * 0.012;
      const rx = 44 * wob * (1 + 0.05 * t); // dentro da caixa: a máscara corta o que passa da borda
      const ry = 44 * wob * (1 - 0.05 * t);
      pts.push(`${(50 + rx * Math.cos(a)).toFixed(2)} ${(50 + ry * Math.sin(a)).toFixed(2)}`);
    }
    return `M ${pts.join(" L ")}`;
  }, [seed, a0]);
  const startDeg = (a0 * 180) / Math.PI + 90; // conic-gradient: 0° = 12h, horário
  const sweep = Math.min(360, p * 390);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {p > 0 ? (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            left: `-${padX}%`,
            top: `-${padY}%`,
            width: `${100 + padX * 2}%`,
            height: `${100 + padY * 2}%`,
            overflow: "visible",
            pointerEvents: "none",
            WebkitMaskImage: `conic-gradient(from ${startDeg}deg at 50% 50%, #000 0deg, #000 ${sweep}deg, transparent ${sweep + 0.5}deg)`,
            maskImage: `conic-gradient(from ${startDeg}deg at 50% 50%, #000 0deg, #000 ${sweep}deg, transparent ${sweep + 0.5}deg)`,
          }}
        >
          <path
            d={d}
            fill="none"
            stroke="#FF4A3D"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 3px rgba(255,70,52,0.55)) drop-shadow(0 0 10px rgba(255,44,30,0.25))" }}
          />
        </svg>
      ) : null}
    </span>
  );
};
