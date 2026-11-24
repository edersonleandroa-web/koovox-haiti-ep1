import React from "react";
import { AbsoluteFill } from "remotion";

/** Vinheta fixa. (Sem grão animado nem oscilação de luz: os dois faziam a imagem "ferver".) */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
      pointerEvents: "none",
    }}
  />
);
