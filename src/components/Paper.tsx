import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { MediaRef } from "../types";
import { C, FONT, SHADOW_OBJ } from "../theme";
import { EASE_OUT, prog, rand } from "../lib/util";
import { MediaView } from "./Media";

/**
 * Coloca um objeto no mural: centro em (x, y), rotação rot. Entra "pousando" (desce, encolhe 7%,
 * gira de leve) a partir do quadro `at`, com a sombra assentando junto.
 */
export const Placed: React.FC<{
  x: number;
  y: number;
  rot?: number;
  at?: number;
  dur?: number;
  children: React.ReactNode;
  z?: number;
}> = ({ x, y, rot = 0, at = 0, dur = 14, children, z }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur, EASE_OUT);
  const o = prog(frame, at, at + 4);
  const ty = interpolate(p, [0, 1], [-46, 0]);
  const s = interpolate(p, [0, 1], [1.08, 1]);
  const r = rot + interpolate(p, [0, 1], [4, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${ty}px) rotate(${r}deg) scale(${s})`,
        opacity: o,
        zIndex: z,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Textura de papel (com <Img>, que o Remotion espera carregar) sobre uma cor base.
 * Conteúdo em fluxo normal que venha depois deve ficar dentro de <Above> para ficar por cima.
 */
export const Tex: React.FC<{ src: string; tint: string; opacity?: number; clip?: string; radius?: number }> = ({
  src,
  tint,
  opacity = 1,
  clip,
  radius,
}) => (
  <AbsoluteFill style={{ backgroundColor: tint, clipPath: clip, borderRadius: radius, overflow: "hidden" }}>
    <Img
      src={staticFile(`textures/${src}`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", opacity }}
    />
  </AbsoluteFill>
);

export const Above: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "relative", ...style }}>{children}</div>
);

export const Pin: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 30, style }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" style={{ position: "absolute", overflow: "visible", ...style }}>
    <defs>
      <radialGradient id="pinhead" cx="38%" cy="34%" r="70%">
        <stop offset="0%" stopColor="#ff7a6e" />
        <stop offset="45%" stopColor="#d3261c" />
        <stop offset="100%" stopColor="#7d0f0a" />
      </radialGradient>
    </defs>
    <ellipse cx="19" cy="21" rx="11" ry="7" fill="rgba(0,0,0,0.45)" />
    <circle cx="15" cy="15" r="11" fill="url(#pinhead)" />
    <ellipse cx="11.5" cy="10.5" rx="3.6" ry="2.4" fill="rgba(255,255,255,0.55)" />
  </svg>
);

const jag = (seed: number, n = 7, amp = 6) => {
  const r = rand(seed);
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * 100;
    left.push(`${r() * amp}% ${y}%`);
    right.push(`${100 - r() * amp}% ${100 - y}%`);
  }
  return `polygon(${[...left, ...right].join(", ")})`;
};

export const Tape: React.FC<{ w: number; h: number; rot?: number; seed?: number; style?: React.CSSProperties }> = ({
  w,
  h,
  rot = 0,
  seed = 1,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      width: w,
      height: h,
      transform: `rotate(${rot}deg)`,
      filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.3))",
      opacity: 0.9,
      ...style,
    }}
  >
    <Tex src="paper.jpg" tint={C.tape} opacity={0.55} clip={jag(seed)} />
    <AbsoluteFill style={{ clipPath: jag(seed), background: "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(0,0,0,0.06))" }} />
  </div>
);

/** Polaroid: foto quadrada + margem inferior larga com legenda à mão (opcional). */
export const Polaroid: React.FC<{
  w: number;
  media: MediaRef | null;
  caption?: string;
  hold?: "tape" | "pin" | "none";
  seed?: number;
  kb?: number; // 0..1 progresso do Ken Burns interno
}> = ({ w, media, caption, hold = "tape", seed = 1, kb = 0 }) => {
  const pad = w * 0.06;
  const photo = w - pad * 2;
  const h = pad + photo + w * 0.24;
  const r = rand(seed);
  return (
    <div style={{ position: "relative", width: w, height: h, boxShadow: SHADOW_OBJ }}>
      <Tex src="paper.jpg" tint={C.polaroid} />
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: photo,
          height: photo,
          overflow: "hidden",
          backgroundColor: "#111",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      >
        <MediaView media={media} scale={1.02 + 0.07 * kb} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.35)" }} />
      </div>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: pad + photo + w * 0.035,
            textAlign: "center",
            fontFamily: FONT.hand,
            fontSize: w * 0.085,
            lineHeight: 1.05,
            color: C.ink,
            transform: `rotate(${(r() - 0.5) * 4}deg)`,
            opacity: 0.88,
          }}
        >
          {caption}
        </div>
      ) : null}
      {hold === "tape" ? (
        <Tape w={w * 0.36} h={w * 0.1} rot={(r() - 0.5) * 10} seed={seed + 3} style={{ left: w * 0.32, top: -w * 0.045 }} />
      ) : null}
      {hold === "pin" ? <Pin size={w * 0.075} style={{ left: w / 2 - w * 0.0375, top: w * 0.008 }} /> : null}
    </div>
  );
};

/** Foto impressa com borda branca fina, presa por tachinha (ou "tela" escura com linhas, dark). */
export const Print: React.FC<{ w: number; aspect?: number; media: MediaRef | null; seed?: number; kb?: number; dark?: boolean }> = ({
  w,
  aspect = 3 / 2,
  media,
  seed = 1,
  kb = 0,
  dark = false,
}) => {
  const b = dark ? w * 0.028 : w * 0.032;
  const ih = (w - b * 2) / aspect;
  const h = ih + b * 2;
  const r = rand(seed);
  return (
    <div style={{ position: "relative", width: w, height: h, boxShadow: SHADOW_OBJ, borderRadius: dark ? 10 : 0, backgroundColor: dark ? "#1b1a18" : undefined }}>
      {dark ? null : <Tex src="paper.jpg" tint={C.polaroid} />}
      <div style={{ position: "absolute", left: b, top: b, width: w - b * 2, height: ih, overflow: "hidden", backgroundColor: "#111", borderRadius: dark ? 6 : 0 }}>
        <MediaView media={media} scale={1.02 + 0.06 * kb} />
        {dark ? (
          <AbsoluteFill
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.55)",
            }}
          />
        ) : (
          <AbsoluteFill style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.3)" }} />
        )}
      </div>
      {dark ? null : <Pin size={w * 0.05} style={{ left: w / 2 - w * 0.025 + (r() - 0.5) * w * 0.1, top: b * 0.2 }} />}
    </div>
  );
};

/** Recorte de jornal: papel-jornal com bordas rasgadas e a foto em P&B. */
export const Clipping: React.FC<{ w: number; aspect?: number; media: MediaRef | null; seed?: number; kb?: number }> = ({
  w,
  aspect = 4 / 3,
  media,
  seed = 1,
  kb = 0,
}) => {
  const m = w * 0.06;
  const ih = (w - m * 2) / aspect;
  const h = ih + m * 2;
  const clip = jag(seed, 11, 2.2);
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.55))" }}>
      <Tex src="newsprint.jpg" tint="#E4DFD3" clip={clip} />
      <div style={{ position: "absolute", left: m, top: m, width: w - m * 2, height: ih, overflow: "hidden" }}>
        <MediaView media={media ? { ...media, grade: "bw" } : media} scale={1.02 + 0.05 * kb} extraFilter="contrast(1.18)" />
      </div>
    </div>
  );
};
