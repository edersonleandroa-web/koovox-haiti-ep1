import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Board } from "../components/Board";
import { MediaView } from "../components/Media";
import { RedString } from "../components/Marks";
import { Pin } from "../components/Paper";
import { useScene } from "../components/SceneCtx";
import { CountUp, Label, TypeText, neonOn } from "../components/Text";
import { EASE_OUT, H, W, fmtNum, prog, rand, sec } from "../lib/util";
import { C, FONT, GLOW_RED, GLOW_WHITE } from "../theme";
import type { DateScene, FullScene, MediaRef, StatScene, TimelineScene } from "../types";
import { Cam, TextShade } from "./common";

/** Fundo de cena gráfica: o mural, ou uma foto/vídeo real escurecida e em P&B. */
const GraphicBg: React.FC<{ media?: MediaRef | null }> = ({ media }) => {
  const frame = useCurrentFrame();
  const { dur } = useScene();
  if (media && media.src) {
    const t = Math.min(1.3, frame / Math.max(1, dur));
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <MediaView media={{ ...media, grade: media.grade ?? "bw" }} scale={1.06 + 0.06 * t} extraFilter="brightness(0.36) blur(1.5px)" />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.25), rgba(0,0,0,0.65))" }} />
      </AbsoluteFill>
    );
  }
  return <Board />;
};

export const FullView: React.FC<{ s: FullScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { dur, seed } = useScene();
  const r = rand(seed);
  const t = Math.min(1.3, frame / Math.max(1, dur));
  const isVideo = s.media?.kind === "video" || /\.(mp4|webm|mov)$/i.test(s.media?.src ?? "");
  const moves = ["in", "out", "left", "right"] as const;
  const move = s.move ?? moves[Math.floor(r() * 4)];
  let scale = 1;
  let dx = 0;
  if (isVideo) {
    scale = 1.03 + 0.04 * t;
  } else if (move === "in") {
    scale = 1.05 + 0.1 * t;
  } else if (move === "out") {
    scale = 1.16 - 0.1 * t;
  } else {
    scale = 1.13;
    dx = (move === "left" ? 1 : -1) * interpolate(t, [0, 1], [46, -46]);
  }
  const labelY = H * 0.72;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <MediaView media={s.media} scale={scale} dx={dx} extraFilter="brightness(0.94)" />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
      {s.label ? (
        <>
          <TextShade x={W / 2} y={labelY} w={1100} h={300} strength={0.5} />
          <Label spec={s.label} x={W / 2} y={labelY} align="center" maxWidth={1100} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const StatView: React.FC<{ s: StatScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const at = sec(s.label?.at ?? s.at ?? 0.35);
  const on = neonOn(frame, at);
  const textAt = at + 22;
  const full = `${s.prefix ?? ""}${fmtNum(s.value, s.decimals ?? 0)}${s.suffix ?? ""}`;
  const fontSize = Math.min(220, Math.floor(1500 / Math.max(1, full.length * 0.47)));
  return (
    <AbsoluteFill>
      <GraphicBg media={s.media} />
      <Cam push={0.03} drift={10}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: FONT.cond,
              fontWeight: 700,
              fontSize,
              lineHeight: 1,
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
              color: C.redNeon,
              textShadow: GLOW_RED,
              opacity: on,
              transform: `scale(${interpolate(prog(frame, at, at + 10, EASE_OUT), [0, 1], [1.1, 1])})`,
            }}
          >
            {s.value >= 10 ? (
              <CountUp value={s.value} at={at} dur={34} decimals={s.decimals ?? 0} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
            ) : (
              full
            )}
          </div>
          {s.text ? (
            <div
              style={{
                marginTop: 22,
                maxWidth: 1100,
                textAlign: "center",
                fontFamily: FONT.type,
                fontSize: 44,
                letterSpacing: "0.12em",
                color: C.white,
                textShadow: GLOW_WHITE,
                textTransform: "uppercase",
              }}
            >
              <TypeText text={s.text} at={textAt} />
            </div>
          ) : null}
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

export const DateView: React.FC<{ s: DateScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const at = sec(s.label?.at ?? s.at ?? 0.3);
  const p = prog(frame, at, at + 7, EASE_OUT);
  const shake = frame >= at + 3 && frame < at + 11 ? Math.sin((frame - at) * 2.7) * (11 - (frame - at)) * 0.9 : 0;
  const long = s.text.length > 8;
  return (
    <AbsoluteFill>
      <GraphicBg media={s.media} />
      <Cam push={0.03} drift={10}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
          <div
            style={{
              fontFamily: FONT.cond,
              fontWeight: 600,
              fontSize: long ? 150 : 230,
              lineHeight: 1,
              letterSpacing: "0.04em",
              color: C.white,
              textShadow: GLOW_WHITE,
              textTransform: "uppercase",
              opacity: frame >= at ? interpolate(p, [0, 0.3, 1], [0, 1, 1]) : 0,
              transform: `scale(${interpolate(p, [0, 1], [1.28, 1])})`,
              textAlign: "center",
              maxWidth: 1500,
            }}
          >
            {s.text}
          </div>
          <div
            style={{
              marginTop: 18,
              width: 180,
              height: 4,
              backgroundColor: C.redBright,
              boxShadow: "0 0 8px rgba(255,60,40,0.5)",
              transform: `scaleX(${prog(frame, at + 6, at + 20, EASE_OUT)})`,
            }}
          />
          {s.sub ? (
            <div style={{ marginTop: 22, fontFamily: FONT.type, fontSize: 40, letterSpacing: "0.18em", color: C.white, textShadow: GLOW_WHITE, textTransform: "uppercase", textAlign: "center", maxWidth: 1200 }}>
              <TypeText text={s.sub} at={at + 16} />
            </div>
          ) : null}
        </AbsoluteFill>
      </Cam>
    </AbsoluteFill>
  );
};

export const TimelineView: React.FC<{ s: TimelineScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { dur } = useScene();
  const items = s.years.slice(0, 7);
  const n = items.length;
  const focus = Math.max(0, Math.min(n - 1, s.focus ?? n - 1));
  const span = Math.min(W * 0.76, Math.max(0, n - 1) * 400);
  const x0 = W / 2 - span / 2;
  const x1 = W / 2 + span / 2;
  const y = H * 0.5;
  const step = n > 1 ? (x1 - x0) / (n - 1) : 0;
  const xs = items.map((_, i) => (n > 1 ? x0 + i * step : W / 2));
  // câmera desliza devagar em direção ao ano em foco
  const t = Math.min(1.3, frame / Math.max(1, dur));
  const camX = interpolate(t, [0, 1], [0, (W / 2 - xs[focus]) * 0.18]);
  return (
    <AbsoluteFill>
      <Board />
      <AbsoluteFill style={{ transform: `translateX(${camX}px) scale(${1 + 0.03 * t})`, willChange: "transform" }}>
        <RedString x1={x0 - 60} y1={y} x2={x1 + 60} y2={y} at={4} dur={30} sag={18} width={3.4} />
        {items.map((it, i) => {
          // cada pino aparece quando o fio passa por ele
          const at = 4 + Math.round(((xs[i] - (x0 - 60)) / (x1 - x0 + 120)) * 30);
          const isF = i === focus;
          const on = neonOn(frame, at + (isF ? 10 : 0));
          const sy = interpolate(prog(frame, at, at + 10, EASE_OUT), [0, 1], [14, 0]);
          return (
            <React.Fragment key={i}>
              <Pin size={isF ? 30 : 22} style={{ left: xs[i] - (isF ? 15 : 11), top: y - (isF ? 15 : 11) + 6, opacity: prog(frame, at, at + 4) }} />
              <div
                style={{
                  position: "absolute",
                  left: xs[i],
                  top: y - 70 + sy,
                  transform: "translate(-50%, -100%)",
                  fontFamily: FONT.cond,
                  fontWeight: isF ? 700 : 500,
                  fontSize: isF ? 92 : 62,
                  letterSpacing: "0.03em",
                  color: isF ? C.redNeon : C.white,
                  textShadow: isF ? GLOW_RED : GLOW_WHITE,
                  opacity: isF ? on : 0.62 * on,
                  whiteSpace: "nowrap",
                }}
              >
                {it.year}
              </div>
              {it.text ? (
                <div
                  style={{
                    position: "absolute",
                    left: xs[i],
                    top: y + 44,
                    width: Math.max(220, Math.min(360, step - 24)),
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    fontFamily: FONT.type,
                    fontSize: isF ? 32 : 27,
                    lineHeight: 1.2,
                    letterSpacing: "0.06em",
                    color: C.white,
                    textShadow: GLOW_WHITE,
                    opacity: (isF ? 1 : 0.6) * prog(frame, at + 6, at + 14),
                    textTransform: "uppercase",
                  }}
                >
                  {it.text}
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      {s.label ? <Label spec={s.label} x={W / 2} y={H * 0.8} /> : null}
    </AbsoluteFill>
  );
};
