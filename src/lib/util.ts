import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const sec = (s: number) => Math.round(s * FPS);

/** PRNG determinístico (mulberry32) — nada de Math.random() no render. */
export const rand = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entre os quadros a e b, com easing. */
export const prog = (frame: number, a: number, b: number, ease: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN = Easing.in(Easing.cubic);
export const EASE_IO = Easing.inOut(Easing.cubic);
export const EASE_BACK = Easing.out(Easing.back(1.6));

/** Formata número para o público hispano-americano (es-MX: 5,940,000 · 1.5). */
export const fmtNum = (v: number, decimals = 0) =>
  v.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
