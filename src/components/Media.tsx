import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import type { Grade, MediaRef } from "../types";
import { sec } from "../lib/util";

export const gradeFilter = (g: Grade | undefined, extra = "") => {
  const base =
    g === "bw"
      ? "grayscale(1) contrast(1.14) brightness(0.95)"
      : g === "warm"
        ? "sepia(0.24) saturate(0.74) contrast(1.07) brightness(0.97)"
        : g === "cold"
          ? "saturate(0.6) contrast(1.1) brightness(0.94) hue-rotate(-6deg)"
          : "saturate(0.86) contrast(1.05)";
  return `${base} ${extra}`.trim();
};

/**
 * Foto ou vídeo real preenchendo o contêiner (cover), com ponto de foco, tratamento de cor e
 * movimento de câmera (scale/translate) aplicados por quem chama.
 */
export const MediaView: React.FC<{
  media: MediaRef | null | undefined;
  scale?: number;
  dx?: number; // px
  dy?: number; // px
  extraFilter?: string;
  fallbackLabel?: string;
}> = ({ media, scale = 1, dx = 0, dy = 0, extraFilter = "" }) => {
  if (!media || !media.src) {
    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 38%, #4a4741 0%, #26241f 60%, #161513 100%)",
        }}
      >
        {/* sem foto livre: silhueta de "não identificado" com interrogação vermelha (intencional) */}
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="50" cy="38" r="15" fill="#0f0e0c" opacity={0.85} />
          <path d="M18 100 C20 72 34 60 50 60 C66 60 80 72 82 100 Z" fill="#0f0e0c" opacity={0.85} />
          <text
            x="50"
            y="47"
            textAnchor="middle"
            style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, fill: "#E2362B", filter: "drop-shadow(0 0 2px rgba(255,70,52,0.6))" }}
          >
            ?
          </text>
        </svg>
      </AbsoluteFill>
    );
  }
  const [fx, fy] = media.focus ?? [0.5, 0.45];
  const filter = gradeFilter(media.grade, extraFilter);
  const transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  const origin = `${fx * 100}% ${fy * 100}%`;
  if (media.kind === "video" || /\.(mp4|webm|mov)$/i.test(media.src)) {
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill style={{ transform, transformOrigin: origin, filter }}>
          <Video
            src={staticFile(media.src)}
            muted
            loop
            trimBefore={media.trim ? sec(media.trim) : undefined}
            playbackRate={media.rate ?? 1}
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(media.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: origin,
          transform,
          transformOrigin: origin,
          filter,
        }}
      />
    </AbsoluteFill>
  );
};
