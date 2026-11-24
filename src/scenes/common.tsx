import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Câmera do mural: parada. Push e deriva lentos moviam tudo em frações de pixel a cada quadro e
 * faziam textos, linhas e objetos tremerem.
 */
export const Cam: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;

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
