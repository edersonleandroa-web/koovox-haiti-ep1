import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { H, W, rand } from "../lib/util";
import { useScene } from "./SceneCtx";

const TEX_W = 3000;
const TEX_H = 2960;

/**
 * O fundo quadriculado do usuário (ampliado no Magnific). Cada cena mostra um pedaço diferente do
 * mesmo quadro, parado (deslizar em frações de pixel fazia o quadriculado tremer).
 */
export const Board: React.FC<{ dim?: number; scale?: number }> = ({ dim = 0, scale = 0.74 }) => {
  const { seed } = useScene();
  const r = rand(seed * 31 + 7);
  const w = TEX_W * scale;
  const h = TEX_H * scale;
  const x0 = Math.round(80 + r() * (w - W - 160));
  const y0 = Math.round(80 + r() * (h - H - 160));
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#141414" }}>
      <Img
        src={staticFile("textures/fundo-limpo.jpg")}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          transform: `translate(${-x0}px, ${-y0}px)`,
        }}
      />
      {/* luz de cima: centro um pouco mais claro, bordas mais escuras */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 46%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {dim > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};
