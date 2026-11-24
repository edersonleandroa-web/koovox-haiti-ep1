import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Board } from "../components/Board";
import { TypeText, neonOn } from "../components/Text";
import { prog } from "../lib/util";
import { C, FONT, GLOW_RED, GLOW_WHITE } from "../theme";

/** Cartão de capítulo: "CAPÍTULO N" + título, neon acendendo, traço vermelho se desenha. */
export const ChapterCard: React.FC<{ number: string; title: string; dur: number }> = ({ number, title, dur }) => {
  const frame = useCurrentFrame();
  const kOn = neonOn(frame, 6);
  const tOn = neonOn(frame, 14);
  const out = 1 - prog(frame, dur - 12, dur);
  return (
    <AbsoluteFill>
      <Board dim={0.25} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: out }}>
        <div style={{ fontFamily: FONT.type, fontSize: 36, letterSpacing: "0.5em", color: C.redNeon, textShadow: GLOW_RED, opacity: kOn, marginBottom: 18, paddingLeft: "0.5em" }}>
          {number}
        </div>
        <div
          style={{
            fontFamily: FONT.cond,
            fontWeight: 600,
            fontSize: 124,
            lineHeight: 1.02,
            letterSpacing: "0.04em",
            color: C.white,
            textShadow: GLOW_WHITE,
            opacity: tOn,
            textAlign: "center",
            maxWidth: 1500,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Título do episódio depois da introdução. */
export const TitleCard: React.FC<{ title: string; sub: string; kicker: string; dur: number }> = ({ title, sub, kicker, dur }) => {
  const frame = useCurrentFrame();
  const on = neonOn(frame, 8);
  const out = 1 - prog(frame, dur - 14, dur);
  return (
    <AbsoluteFill>
      <Board dim={0.32} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: out }}>
        <div style={{ fontFamily: FONT.type, fontSize: 30, letterSpacing: "0.55em", color: C.white, textShadow: GLOW_WHITE, opacity: neonOn(frame, 2) * 0.8, paddingLeft: "0.55em", marginBottom: 10 }}>
          {kicker}
        </div>
        <div
          style={{
            fontFamily: FONT.cond,
            fontWeight: 700,
            fontSize: 290,
            lineHeight: 0.95,
            letterSpacing: "0.1em",
            paddingLeft: "0.1em",
            color: C.white,
            textShadow: GLOW_WHITE,
            opacity: on,
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 26, fontFamily: FONT.type, fontSize: 40, letterSpacing: "0.26em", color: C.redNeon, textShadow: GLOW_RED, textTransform: "uppercase" }}>
          <TypeText text={sub} at={30} cps={22} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Encerramento: logo do canal sobre o mural; único fade para preto do filme. */
export const Outro: React.FC<{ dur: number; continueLogo?: boolean }> = ({ dur, continueLogo = false }) => {
  const frame = useCurrentFrame();
  const on = continueLogo ? 1 : neonOn(frame, 10);
  const black = prog(frame, dur - 30, dur);
  return (
    <AbsoluteFill>
      <Board dim={0.35} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("brand/koovox.png")}
          style={{
            width: continueLogo ? 430 : 380,
            opacity: on,
            filter: "drop-shadow(0 0 8px rgba(255,245,230,0.35)) drop-shadow(0 0 22px rgba(255,236,214,0.15))",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${black})` }} />
    </AbsoluteFill>
  );
};
