import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Board } from "../components/Board";
import { RedString, TypedLines } from "../components/Marks";
import { Above, Clipping, Pin, Placed, Polaroid, Print, Tex } from "../components/Paper";
import { useScene } from "../components/SceneCtx";
import { Label, TypeText, neonOn } from "../components/Text";
import { MediaView } from "../components/Media";
import { EASE_OUT, H, W, prog, rand, sec } from "../lib/util";
import { C, FONT, GLOW_RED, GLOW_WHITE, SHADOW_OBJ } from "../theme";
import type { DocScene, DuoScene, HeadlineScene, NetworkScene, PersonScene, PhotoScene } from "../types";
import { Cam } from "./common";
import CUTOUTS from "../data/cutouts.json";


export const PhotoView: React.FC<{ s: PhotoScene }> = ({ s }) => {
  const { seed } = useScene();
  const r = rand(seed);
  const hasLabel = Boolean(s.label);
  const ft = s.frame ?? "polaroid";
  const rot = (r() - 0.5) * 7;
  const cy = H * 0.49;
  let obj: React.ReactNode;
  let cx = hasLabel ? W * 0.37 : W * 0.5;
  if (ft === "polaroid") {
    obj = <Polaroid w={hasLabel ? 500 : 560} media={s.media} caption={s.caption} hold={r() < 0.6 ? "tape" : "pin"} seed={seed} />;
  } else if (ft === "print") {
    cx = hasLabel ? W * 0.33 : W * 0.5;
    obj = <Print w={hasLabel ? 760 : 1060} media={s.media} seed={seed} />;
  } else if (ft === "tv") {
    cx = hasLabel ? W * 0.33 : W * 0.5;
    obj = <Print w={hasLabel ? 780 : 1100} media={s.media} seed={seed} dark />;
  } else {
    cx = hasLabel ? W * 0.33 : W * 0.5;
    obj = <Clipping w={hasLabel ? 720 : 980} media={s.media} seed={seed} />;
  }
  return (
    <AbsoluteFill>
      <Board />
      <Cam>
        <Placed x={cx} y={cy} rot={ft === "tv" ? rot * 0.3 : rot} at={2}>
          {obj}
        </Placed>
      </Cam>
      {s.label ? <Label spec={s.label} x={ft === "polaroid" ? W * 0.6 : W * 0.63} y={H * 0.5} align="left" maxWidth={620} /> : null}
    </AbsoluteFill>
  );
};

/**
 * Retrato recortado (fundo removido no Magnific) sobre um disco e um anel vermelho neon.
 * Figura e anel se ajustam à proporção do recorte (src/data/cutouts.json): bustos largos ficam
 * menores e o anel desce até a altura do rosto.
 */
const Cutout: React.FC<{ src: string; grade?: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const aspect = (CUTOUTS as Record<string, number>)[src] ?? 0.78;
  const boxW = 780;
  const figH = Math.min(H * 0.84, boxW / aspect);
  const figW = figH * aspect;
  const cx = aspect > 1 ? W * 0.34 : W * 0.36;
  const top = H - figH;
  const R = Math.round(Math.min(300, figH * 0.42));
  const ringY = Math.min(H * 0.6, Math.max(H * 0.42, top + figH * 0.34));
  const ring = prog(frame, 4, 26, EASE_OUT);
  const rise = prog(frame, 6, 24, EASE_OUT);
  const circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: cx - R * 1.25,
          top: ringY - R * 1.25,
          width: R * 2.5,
          height: R * 2.5,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,35,27,0.42) 0%, rgba(201,35,27,0.18) 45%, rgba(201,35,27,0) 70%)",
          transform: `scale(${interpolate(ring, [0, 1], [0.6, 1])})`,
          opacity: ring,
        }}
      />
      <svg style={{ position: "absolute", left: cx - R - 10, top: ringY - R - 10, width: R * 2 + 20, height: R * 2 + 20, overflow: "visible" }}>
        <circle
          cx={R + 10}
          cy={R + 10}
          r={R}
          fill="none"
          stroke={C.redNeon}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ring)}
          transform={`rotate(-90 ${R + 10} ${R + 10})`}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,70,52,0.7)) drop-shadow(0 0 12px rgba(255,44,30,0.35))" }}
        />
      </svg>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: cx,
          bottom: -6,
          width: figW,
          height: figH,
          transform: `translateX(-50%) translateY(${interpolate(rise, [0, 1], [70, 0])}px)`,
          opacity: prog(frame, 6, 12),
          filter:
            "grayscale(1) contrast(1.15) brightness(0.98) drop-shadow(3px 0 0 #f1eee6) drop-shadow(-3px 0 0 #f1eee6) drop-shadow(0 3px 0 #f1eee6) drop-shadow(0 -3px 0 #f1eee6) drop-shadow(0 18px 26px rgba(0,0,0,0.6))",
        }}
      />
    </AbsoluteFill>
  );
};

export const PersonView: React.FC<{ s: PersonScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { seed } = useScene();
  const r = rand(seed);
  const cut = s.media?.cutout;
  // linha vermelha: anos, ou o rótulo da cena (ex.: data do assassinato)
  const lab = s.label ? (s.label.sub ? `${s.label.text}${/^\d{4}$/.test(s.label.sub) ? " DE " : " · "}${s.label.sub}` : s.label.text) : undefined;
  const redLine = [s.years, lab].filter(Boolean).join("  ·  ");
  const nameAt = sec(0.55);
  const roleAt = nameAt + sec(Math.min(1.1, s.name.length / 24)) + 4;
  const yearsAt = roleAt + 10;
  const roleP = prog(frame, roleAt, roleAt + 12);
  const yearsOn = neonOn(frame, yearsAt);
  return (
    <AbsoluteFill>
      <Board />
      {cut ? (
        <Cutout src={cut} />
      ) : (
        <Cam>
          <Placed x={W * 0.365} y={H * 0.49} rot={(r() - 0.5) * 6} at={2}>
            <Polaroid w={470} media={s.media} hold="pin" seed={seed} />
          </Placed>
        </Cam>
      )}
      <div style={{ position: "absolute", left: cut ? W * 0.57 : W * 0.525, top: H * 0.5, transform: "translateY(-50%)", width: cut ? 680 : 720 }}>
        <div style={{ fontFamily: FONT.type, fontSize: 56, letterSpacing: "0.06em", lineHeight: 1.1, color: C.white, textShadow: GLOW_WHITE, textTransform: "uppercase" }}>
          <TypeText text={s.name} at={nameAt} />
        </div>
        <div style={{ height: 18 }} />
        {s.role ? (
          <div style={{ fontFamily: FONT.type, fontSize: 28, letterSpacing: "0.22em", color: C.white, opacity: 0.82 * roleP, textShadow: GLOW_WHITE, textTransform: "uppercase" }}>
            {s.role}
          </div>
        ) : null}
        {redLine ? (
          <div style={{ marginTop: 12, fontFamily: FONT.cond, fontWeight: 600, fontSize: 46, letterSpacing: "0.05em", color: C.redNeon, textShadow: GLOW_RED, opacity: yearsOn, textTransform: "uppercase" }}>
            {redLine}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const DuoView: React.FC<{ s: DuoScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { dur, seed } = useScene();
  const r = rand(seed);
  const items = s.items.slice(0, 2);
  // o 1º objeto entra logo no começo (nunca mural vazio); o 2º na palavra que o motiva
  const at0 = Math.min(sec(0.35), items[0]?.at !== undefined ? sec(items[0].at as number) : 2);
  const at1 = items[1]?.at !== undefined ? Math.max(at0 + 8, Math.min(sec(items[1].at as number), dur - sec(1.8))) : at0 + sec(0.55);
  const pos = [
    { x: W * 0.31, y: H * 0.44, rot: -4 - r() * 3, at: at0 },
    { x: W * 0.69, y: H * 0.44, rot: 3 + r() * 3, at: at1 },
  ];
  const pw = 370;
  const pinY = H * 0.44 - (pw * 1.18) / 2 + 12;
  const stringAt = at1 + 14;
  const sagX = W * 0.5;
  const sagY = pinY + 55;
  return (
    <AbsoluteFill>
      <Board />
      <Cam>
        {items.map((it, i) => (
          <Placed key={i} x={pos[i].x} y={pos[i].y} rot={pos[i].rot} at={pos[i].at}>
            <Polaroid w={pw} media={it.media} hold="pin" seed={seed + i * 17} />
          </Placed>
        ))}
        <RedString x1={pos[0].x} y1={pinY} x2={pos[1].x} y2={pinY} at={stringAt} sag={110} />
      </Cam>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pos[i].x,
            top: H * 0.765,
            transform: "translateX(-50%)",
            fontFamily: FONT.type,
            fontSize: 36,
            letterSpacing: "0.1em",
            color: C.white,
            textShadow: GLOW_WHITE,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          <TypeText text={it.name} at={pos[i].at + 10} />
        </div>
      ))}
      {s.link ? (
        <div
          style={{
            position: "absolute",
            left: sagX,
            top: sagY + 30,
            transform: "translateX(-50%)",
            fontFamily: s.link.length <= 4 ? FONT.cond : FONT.type,
            fontWeight: s.link.length <= 4 ? 700 : 400,
            fontSize: s.link.length <= 4 ? 80 : s.link.length <= 11 ? 34 : 24,
            letterSpacing: s.link.length <= 4 ? "0.04em" : s.link.length <= 11 ? "0.16em" : "0.08em",
            color: C.redNeon,
            textShadow: GLOW_RED,
            opacity: neonOn(frame, stringAt + 14),
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {s.link}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const NetworkView: React.FC<{ s: NetworkScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { dur, seed } = useScene();
  const items = s.items.slice(0, 5);
  const n = items.length;
  const cx = W * 0.5;
  const cy = H * 0.5;
  const rx = W * 0.3;
  const ry = H * 0.3;
  const pw = 200;
  const centerOn = neonOn(frame, sec(0.3));
  return (
    <AbsoluteFill>
      <Board />
      <Cam>
        {items.map((it, i) => {
          const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (n % 2 === 0 ? Math.PI / n : 0);
          const x = cx + Math.cos(a) * rx;
          const y = cy + Math.sin(a) * ry;
          const at = i === 0 ? Math.min(sec(0.35), it.at !== undefined ? sec(it.at) : 10) : Math.min(dur - sec(1.6), it.at !== undefined ? sec(it.at) : sec(0.5 + i * 0.4));
          const overName = y < cy && Math.abs(x - cx) < pw / 2;
          const y2 = overName ? y + (pw * 1.18) / 2 + 26 + 40 : y - (pw * 1.18) / 2 + 10;
          return (
            <React.Fragment key={i}>
              <RedString x1={cx} y1={cy} x2={x} y2={y2} at={at + 8} sag={30} />
              <Placed x={x} y={y} rot={((i * 37) % 9) - 4} at={at}>
                <Polaroid w={pw} media={it.media} hold="pin" seed={seed + i * 11} />
              </Placed>
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y + (pw * 1.18) / 2 + 26,
                  transform: "translateX(-50%)",
                  fontFamily: FONT.type,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                  color: C.white,
                  textShadow: GLOW_WHITE,
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                <TypeText text={it.name} at={at + 10} />
              </div>
            </React.Fragment>
          );
        })}
        {s.center ? (
          <div
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              transform: "translate(-50%, -50%) rotate(-2deg)",
              padding: "16px 30px",
              backgroundColor: "#1a1917",
              border: `2px solid ${C.redBright}`,
              boxShadow: `${SHADOW_OBJ}, 0 0 14px rgba(255,60,40,0.25)`,
              fontFamily: FONT.cond,
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: "0.06em",
              color: C.redNeon,
              textShadow: GLOW_RED,
              opacity: centerOn,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {s.center}
          </div>
        ) : (
          <Pin size={34} style={{ left: cx - 17, top: cy - 17 }} />
        )}
      </Cam>
    </AbsoluteFill>
  );
};

export const DocView: React.FC<{ s: DocScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { seed } = useScene();
  const hasLabel = Boolean(s.label);
  const cx = hasLabel ? W * 0.39 : W * 0.5;
  const cy = H * 0.52;
  const fw = 900;
  const fh = 600;
  const slide = prog(frame, 8, 26, EASE_OUT);
  return (
    <AbsoluteFill>
      <Board />
      <Cam>
        <Placed x={cx} y={cy} rot={-2} at={2}>
          <div style={{ position: "relative", width: fw, height: fh }}>
            {/* aba da pasta */}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: -46,
                width: 330,
                height: 60,
                borderRadius: "12px 12px 0 0",
                overflow: "hidden",
                boxShadow: "0 -2px 6px rgba(0,0,0,0.3)",
              }}
            >
              <Tex src="kraft.jpg" tint={C.paper} />
            </div>
            {/* folha saindo da pasta */}
            <div
              style={{
                position: "absolute",
                left: 70,
                top: interpolate(slide, [0, 1], [40, -110]),
                width: fw - 150,
                height: fh,
                transform: "rotate(1.8deg)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                padding: "54px 60px",
                boxSizing: "border-box",
              }}
            >
              <Tex src="paper.jpg" tint={C.paper} />
              <Above>
                <TypedLines n={7} width={fw - 330} seed={seed} at={14} />
              </Above>
            </div>
            {/* corpo da pasta */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                top: 12,
                borderRadius: 6,
                boxShadow: SHADOW_OBJ,
              }}
            >
              <Tex src="kraft.jpg" tint={C.paper} radius={6} />
              <div style={{ position: "absolute", left: 60, top: 70, right: 60, fontFamily: FONT.type, fontSize: 40, letterSpacing: "0.12em", color: C.ink, textTransform: "uppercase", lineHeight: 1.2 }}>
                <TypeText text={s.title} at={10} />
              </div>
              {s.media && s.media.src ? (
                <div style={{ position: "absolute", left: 60, top: 190, width: 330, height: 250, transform: "rotate(-3deg)", boxShadow: "0 8px 18px rgba(0,0,0,0.45)", border: "10px solid #f1eee6", overflow: "hidden", backgroundColor: "#111" }}>
                  <MediaView media={{ ...s.media, grade: s.media.grade ?? "bw" }} scale={1.03} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: s.media && s.media.src ? 440 : 60, top: 200 }}>
                <TypedLines n={6} width={s.media && s.media.src ? 360 : 700} seed={seed + 5} at={18} gap={30} />
              </div>
            </div>
          </div>
        </Placed>
      </Cam>
      {s.label ? <Label spec={s.label} x={W * 0.66} y={H * 0.5} align="left" maxWidth={560} /> : null}
    </AbsoluteFill>
  );
};

export const HeadlineView: React.FC<{ s: HeadlineScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { seed } = useScene();
  const hasMedia = Boolean(s.media && s.media.src);
  const cw = 1080;
  const reveal = prog(frame, 10, 34, EASE_OUT);
  return (
    <AbsoluteFill>
      <Board />
      <Cam>
        <Placed x={W * 0.5} y={H * 0.5} rot={1.3} at={2}>
          <div style={{ position: "relative", width: cw, filter: "drop-shadow(0 20px 28px rgba(0,0,0,0.55))" }}>
            <div
              style={{
                position: "relative",
                padding: "46px 64px 54px",
                clipPath:
                  "polygon(0% 1%, 6% 0%, 14% 1.2%, 23% 0.2%, 31% 1%, 42% 0%, 55% 1.1%, 63% 0.2%, 74% 1%, 85% 0%, 93% 1%, 100% 0.4%, 99.2% 20%, 100% 42%, 99.4% 63%, 100% 81%, 99.3% 100%, 88% 99%, 77% 100%, 66% 99.1%, 52% 100%, 41% 99%, 30% 100%, 18% 99.2%, 8% 100%, 0.4% 99%, 0.8% 78%, 0% 57%, 0.7% 36%, 0% 18%)",
              }}
            >
              <Tex src="newsprint.jpg" tint="#E6E1D5" />
              <Above>
              {s.date ? (
                <div style={{ fontFamily: FONT.type, fontSize: 22, letterSpacing: "0.3em", color: C.inkSoft, textTransform: "uppercase", marginBottom: 14 }}>
                  {s.date}
                </div>
              ) : null}
              <div style={{ height: 10 }} />
              <div
                style={{
                  fontFamily: FONT.cond,
                  fontWeight: 700,
                  fontSize: 68,
                  lineHeight: 1.02,
                  color: "#1b1a17",
                  textTransform: "uppercase",
                  clipPath: `inset(0 ${100 - reveal * 100}% 0 0)`,
                }}
              >
                {s.headline}
              </div>
              <div style={{ display: "flex", gap: 34, marginTop: 26 }}>
                {hasMedia ? (
                  <div style={{ position: "relative", width: 470, height: 300, overflow: "hidden", flexShrink: 0, backgroundColor: "#222" }}>
                    <MediaView media={s.media ? { ...s.media, grade: "bw" } : null} scale={1.03} extraFilter="contrast(1.25)" />
                  </div>
                ) : null}
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <TypedLines n={hasMedia ? 9 : 5} width={hasMedia ? 420 : 900} seed={seed} at={22} gap={30} />
                </div>
              </div>
              </Above>
            </div>
            <Pin size={40} style={{ left: cw / 2 - 20, top: 6 }} />
          </div>
        </Placed>
      </Cam>
    </AbsoluteFill>
  );
};

export const LogoView: React.FC = () => {
  const frame = useCurrentFrame();
  const on = neonOn(frame, 4);
  return (
    <AbsoluteFill>
      <Board dim={0.35} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("brand/koovox.png")}
          style={{
            width: 430,
            opacity: on,
            filter: "drop-shadow(0 0 8px rgba(255,245,230,0.35)) drop-shadow(0 0 22px rgba(255,236,214,0.15))",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
