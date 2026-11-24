import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { LabelSpec } from "../types";
import { C, FONT, GLOW_RED, GLOW_WHITE } from "../theme";
import { EASE_OUT, FPS, fmtNum, prog, sec } from "../lib/util";
import { CircleMark, Highlight } from "./Emphasis";

/**
 * Máquina de escrever: revela caractere a caractere a partir do quadro `at` (cps = caracteres/s).
 * O resto do texto fica invisível no layout, então nada "pula" enquanto digita.
 */
export const TypeText: React.FC<{ text: string; at: number; cps?: number; style?: React.CSSProperties; caret?: boolean }> = ({
  text,
  at,
  cps = 26,
  style,
  caret = false,
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - at) * cps) / FPS)));
  const typing = n > 0 && n < text.length;
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
      {caret && typing ? <span style={{ position: "absolute" }}>▌</span> : null}
    </span>
  );
};

/** O texto acende com um fade curto (6 quadros), sem piscar. */
export const neonOn = (frame: number, at: number) => prog(frame, at, at + 6);

export const labelStyle = (kind: LabelSpec["kind"]): React.CSSProperties => {
  switch (kind) {
    case "date":
      return { fontFamily: FONT.cond, fontWeight: 600, fontSize: 62, letterSpacing: "0.05em", color: C.white, textShadow: GLOW_WHITE };
    case "number":
      return { fontFamily: FONT.cond, fontWeight: 700, fontSize: 84, letterSpacing: "0.03em", color: C.redNeon, textShadow: GLOW_RED };
    case "name":
      return { fontFamily: FONT.type, fontSize: 50, letterSpacing: "0.08em", color: C.white, textShadow: GLOW_WHITE };
    case "place":
      return { fontFamily: FONT.type, fontSize: 46, letterSpacing: "0.16em", color: C.white, textShadow: GLOW_WHITE };
    default:
      return { fontFamily: FONT.type, fontSize: 42, letterSpacing: "0.1em", color: C.white, textShadow: GLOW_WHITE };
  }
};

/**
 * Rótulo de tela (lugar, nome, data, número ou informação essencial). Fica no espaço da tela
 * (fora da câmera) — parado, perto do centro, com neon leve e um traço vermelho que se desenha.
 * align: "center" (x = centro do texto) ou "left" (x = borda esquerda).
 */
export const Label: React.FC<{
  spec: LabelSpec;
  x: number;
  y: number;
  align?: "center" | "left";
  maxWidth?: number;
  defaultAt?: number;
  tag?: boolean; // etiqueta escura por trás (texto sobre papel claro, ex. mapa)
}> = ({ spec, x, y, align = "center", maxWidth = 760, defaultAt = 0.5, tag = false }) => {
  const frame = useCurrentFrame();
  const at = sec(spec.at ?? defaultAt);
  const kind = spec.kind ?? "info";
  const typed = kind === "place" || kind === "name" || kind === "info";
  const base = labelStyle(kind);
  const on = neonOn(frame, at);
  const slam = prog(frame, at, at + 8, EASE_OUT);
  const typedEnd = at + sec(Math.min(1.4, spec.text.length / 26)) + 2;
  const wanted = spec.mark ?? (kind === "info" && !tag ? "marker" : "none");
  // círculo à mão só fecha bem em palavra curta; texto longo vira marca-texto
  const mark = wanted === "circle" && spec.text.length > 8 ? "marker" : wanted;
  const subAt = at + sec(Math.min(1.2, 0.18 + spec.text.length / 26));
  const sub = spec.sub ? prog(frame, subAt, subAt + 10) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "center" ? "-50%" : "0"}, -50%)`,
        width: "max-content",
        maxWidth,
        textAlign: align,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 10,
      }}
    >
      {tag ? (
        <div
          style={{
            position: "absolute",
            inset: "-22px -34px",
            backgroundColor: "rgba(20,19,17,0.9)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
            opacity: frame >= at ? prog(frame, at - 2, at + 4) : 0,
            zIndex: -1,
          }}
        />
      ) : null}
      <div
        style={{
          ...base,
          lineHeight: 1.08,
          textTransform: "uppercase",
          opacity: typed ? (frame >= at ? 1 : 0) : on,
          transform: typed ? undefined : `scale(${interpolate(slam, [0, 1], [1.12, 1])})`,
        }}
      >
        {mark === "marker" ? (
          <Highlight at={typed ? typedEnd : at + 6}>{typed ? <TypeText text={spec.text} at={at} /> : spec.text}</Highlight>
        ) : mark === "circle" ? (
          <CircleMark at={typed ? typedEnd : at + 8}>{typed ? <TypeText text={spec.text} at={at} /> : spec.text}</CircleMark>
        ) : typed ? (
          <TypeText text={spec.text} at={at} />
        ) : (
          spec.text
        )}
      </div>
      {spec.sub ? (
        <div
          style={{
            fontFamily: FONT.type,
            fontSize: 26,
            letterSpacing: "0.24em",
            color: C.white,
            opacity: 0.78 * sub,
            textShadow: GLOW_WHITE,
            textTransform: "uppercase",
          }}
        >
          {spec.sub}
        </div>
      ) : null}
    </div>
  );
};

/** Número que conta de 0 até value (ease-out), formato brasileiro. */
export const CountUp: React.FC<{
  value: number;
  at: number;
  dur?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ value, at, dur = 40, decimals = 0, prefix = "", suffix = "", style }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur, EASE_OUT);
  const v = value * p;
  // largura fixa (a do número final) e dígitos de mesma largura: o número cresce sem sacudir o centro
  return (
    <span style={{ ...style, position: "relative", display: "inline-block", fontVariantNumeric: "tabular-nums" }}>
      <span style={{ visibility: "hidden" }}>
        {prefix}
        {fmtNum(decimals ? value : Math.round(value), decimals)}
        {suffix}
      </span>
      <span style={{ position: "absolute", right: 0, top: 0, whiteSpace: "nowrap" }}>
        {prefix}
        {fmtNum(decimals ? v : Math.round(v), decimals)}
        {suffix}
      </span>
    </span>
  );
};
