import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { geoBounds, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-50m.json";
import adm1Raw from "../data/geo/hti-adm1.json";
import adm3Raw from "../data/geo/hti-adm3.json";
import hispRaw from "../data/geo/hispaniola-10m.json";
import { Board } from "../components/Board";
import { Placed, Tex } from "../components/Paper";
import { useScene } from "../components/SceneCtx";
import { Label, TypeText } from "../components/Text";
import { EASE_OUT, H, W, prog, sec } from "../lib/util";
import { C, FONT, SHADOW_OBJ } from "../theme";
import type { MapScene, MapView } from "../types";

type Feat = Feature<Geometry, { name?: string; shapeName?: string }>;

const world = feature(
  worldTopo as unknown as Topology,
  (worldTopo as unknown as Topology).objects.countries as GeometryCollection,
) as unknown as FeatureCollection<Geometry, { name: string }>;
// geoBoundaries segue a RFC 7946 (anel externo anti-horário); o d3-geo espera o anel externo
// horário — sem inverter, ele pinta "o mundo menos o polígono". Reorienta os anéis ao carregar.
type Ring = number[][];
const signedArea = (r: Ring) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  return a / 2; // > 0: anti-horário (x = lon, y = lat)
};
const fixPolygon = (poly: Ring[]) =>
  poly.map((ring, k) => {
    const ccw = signedArea(ring) > 0;
    return (k === 0 ? ccw : !ccw) ? [...ring].reverse() : ring;
  });
const rewind = <P,>(fc: FeatureCollection<Geometry, P>): FeatureCollection<Geometry, P> => ({
  ...fc,
  features: fc.features.map((f) => {
    const g = f.geometry as unknown as { type: string; coordinates: unknown };
    if (g.type === "Polygon") return { ...f, geometry: { ...g, coordinates: fixPolygon(g.coordinates as Ring[]) } as unknown as Geometry };
    if (g.type === "MultiPolygon")
      return { ...f, geometry: { ...g, coordinates: (g.coordinates as Ring[][]).map(fixPolygon) } as unknown as Geometry };
    return f;
  }),
});
const adm1 = rewind(adm1Raw as unknown as FeatureCollection<Geometry, { shapeName: string }>);
const adm3 = rewind(adm3Raw as unknown as FeatureCollection<Geometry, { shapeName: string }>);
// litoral 10m (Natural Earth) para as vistas aproximadas — o 50m fica grosseiro em Porto Príncipe
const hisp = hispRaw as unknown as FeatureCollection<Geometry, { name: string }>;

// [oeste, sul, leste, norte]
const VIEWS: Record<MapView, [number, number, number, number]> = {
  americas: [-93.5, 7.5, -60.5, 25.5],
  caribbean: [-86, 15.2, -64, 24.6],
  haiti: [-74.65, 17.9, -71.35, 20.15],
  pap: [-72.56, 18.43, -72.13, 18.67],
};

const COUNTRY_LABELS: Record<MapView, { t: string; lon: number; lat: number; big?: boolean; faint?: boolean }[]> = {
  americas: [
    { t: "EL SALVADOR", lon: -88.9, lat: 14.55 },
    { t: "HAITI", lon: -72.7, lat: 19.45, big: true },
    { t: "MAR DO CARIBE", lon: -77.5, lat: 14.6, faint: true },
    { t: "OCEANO PACÍFICO", lon: -89.5, lat: 9.6, faint: true },
  ],
  caribbean: [
    { t: "HAITI", lon: -72.75, lat: 19.35, big: true },
    { t: "REP. DOMINICANA", lon: -70.4, lat: 18.95 },
    { t: "CUBA", lon: -78.4, lat: 21.75, faint: true },
    { t: "JAMAICA", lon: -77.3, lat: 18.45, faint: true },
    { t: "MAR DO CARIBE", lon: -74.5, lat: 16.3, faint: true },
  ],
  haiti: [
    { t: "HAITI", lon: -73.25, lat: 19.62, big: true },
    { t: "REP. DOMINICANA", lon: -71.62, lat: 19.2, faint: true },
    { t: "MAR DO CARIBE", lon: -73.2, lat: 18.03, faint: true },
  ],
  pap: [{ t: "BAÍA DE PORTO PRÍNCIPE", lon: -72.47, lat: 18.6, faint: true }],
};

const MW = 1760;
const MH = 990;
const PAD = 40;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/(department|departement|du|de la|de l'|des|de)\b/g, "")
    .replace(/[^a-z]/g, "");

const overlaps = (f: Feat, b: [number, number, number, number], m = 2) => {
  const [[w, s], [e, n]] = geoBounds(f);
  return !(e < b[0] - m || w > b[2] + m || n < b[1] - m || s > b[3] + m);
};

type Prepared = {
  project: (lon: number, lat: number) => [number, number];
  countries: { d: string; id: string }[];
  haiti: string;
  adm: { d: string; name: string }[];
  byName: Map<string, { d: string; c: [number, number] }>;
};

const cache = new Map<MapView, Prepared>();

const prepare = (view: MapView): Prepared => {
  const hit = cache.get(view);
  if (hit) return hit;
  const b = VIEWS[view];
  const proj = geoMercator().fitExtent(
    [
      [PAD, PAD],
      [MW - PAD, MH - PAD],
    ],
    { type: "MultiPoint", coordinates: [[b[0], b[1]], [b[2], b[3]]] },
  );
  const path = geoPath(proj);
  const close = view === "haiti" || view === "pap";
  const src = (close ? hisp.features : world.features) as Feat[];
  const countries = src
    .filter((f) => overlaps(f, b))
    .map((f) => ({ d: path(f) ?? "", id: String((f as unknown as { id: string }).id) }));
  const haitiF = src.find((f) => String((f as unknown as { id: string }).id) === "332");
  const detail = view === "pap" ? adm3 : adm1;
  const adm = (detail.features as Feat[])
    .filter((f) => (view === "haiti" ? overlaps(f, b) : view === "pap" ? overlaps(f, b, 0.05) : false))
    .map((f) => ({ d: path(f) ?? "", name: f.properties.shapeName ?? "" }));
  const byName = new Map<string, { d: string; c: [number, number] }>();
  for (const f of [...(adm1.features as Feat[]), ...(adm3.features as Feat[])]) {
    const nm = f.properties.shapeName ?? "";
    const c = proj(geoCentroid(f)) as [number, number];
    byName.set(norm(nm), { d: path(f) ?? "", c });
  }
  const prepared: Prepared = {
    project: (lon, lat) => proj([lon, lat]) as [number, number],
    countries,
    haiti: haitiF ? path(haitiF) ?? "" : "",
    adm,
    byName,
  };
  cache.set(view, prepared);
  return prepared;
};

const MapPinMark: React.FC<{ x: number; y: number; at: number; name: string; sheetFrame: number }> = ({ x, y, at, name, sheetFrame }) => {
  const f = sheetFrame;
  if (f < at) return null;
  const p = prog(f, at, at + 9, EASE_OUT);
  const drop = interpolate(p, [0, 1], [-28, 0]);
  const ring = ((f - at) % 36) / 36;
  const right = x < MW * 0.72;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={10 + ring * 34} fill="none" stroke={C.redBright} strokeWidth={2.2} opacity={(1 - ring) * 0.75} />
      <g transform={`translate(0 ${drop})`}>
        <circle r={13} cx={3} cy={5} fill="rgba(0,0,0,0.35)" />
        <circle r={11} fill={C.red} stroke="#f6efe2" strokeWidth={3} />
        <circle r={3.4} cx={-3} cy={-3} fill="rgba(255,255,255,0.6)" />
      </g>
      <foreignObject x={right ? 22 : -622} y={-26} width={600} height={60} style={{ overflow: "visible" }}>
        <div
          style={{
            textAlign: right ? "left" : "right",
            fontFamily: FONT.type,
            fontSize: 30,
            letterSpacing: "0.1em",
            color: C.ink,
            textShadow: "0 0 6px rgba(240,234,220,0.95), 0 0 2px rgba(240,234,220,0.95)",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          <TypeText text={name} at={at + 6} cps={30} />
        </div>
      </foreignObject>
    </g>
  );
};

/** Camadas estáticas do mapa (papel + mar + países + divisões). Renderizada uma vez por vista. */
export const MapBase: React.FC<{ view: MapView }> = ({ view }) => {
  const m = prepare(view);
  return (
    <AbsoluteFill style={{ backgroundColor: "#E2DBC9" }}>
      <Tex src="paper-wide.jpg" tint="#E2DBC9" />
      <svg width={MW} height={MH} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="sea-base" patternUnits="userSpaceOnUse" width="14" height="14">
            <line x1="0" y1="7" x2="14" y2="7" stroke="rgba(60,72,78,0.10)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={MW} height={MH} fill="rgba(88,104,110,0.30)" />
        <rect x={0} y={0} width={MW} height={MH} fill="url(#sea-base)" />
        <clipPath id="land-base">
          <path d={m.haiti} />
        </clipPath>
        {m.countries.map((c, i) => (
          <path key={i} d={c.d} fill={c.id === "332" ? "#EFE8D6" : "#D6CEBB"} stroke="#4f483e" strokeWidth={c.id === "332" ? 1.8 : 1.1} />
        ))}
        {/* divisões internas só sobre a terra (os limites de comuna avançam pelo mar) */}
        <g clipPath="url(#land-base)">
          {m.adm.map((a, i) => (
            <path key={i} d={a.d} fill="none" stroke="rgba(70,62,52,0.5)" strokeWidth={view === "pap" ? 1.6 : 1} strokeDasharray={view === "pap" ? undefined : "5 4"} />
          ))}
        </g>
        {m.haiti ? <path d={m.haiti} fill="none" stroke="#2a2620" strokeWidth={2.4} /> : null}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(60,45,25,0) 55%, rgba(60,45,25,0.32) 100%)" }} />
    </AbsoluteFill>
  );
};

export const MAP_W = MW;
export const MAP_H = MH;
export const MAP_VIEWS = Object.keys(VIEWS) as MapView[];

export const MapSceneView: React.FC<{ s: MapScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { dur } = useScene();
  const view: MapView = VIEWS[s.view] ? s.view : "haiti";
  const m = useMemo(() => prepare(view), [view]);
  const uid = s.id.replace(/[^a-zA-Z0-9]/g, "");

  const pins = (s.pins ?? []).slice(0, 4).map((p) => ({ ...p, xy: m.project(p.lon, p.lat), atF: sec(p.at ?? 0.8) }));
  const regions = (s.regions ?? [])
    .map((r) => ({ ...r, hit: m.byName.get(norm(r.name)), atF: sec(r.at ?? 0.9) }))
    .filter((r) => r.hit);
  const shade = s.shade
    ? {
        atF: sec(s.shade.at ?? 1),
        parts: s.shade.communes.map((c) => m.byName.get(norm(c))).filter(Boolean) as { d: string; c: [number, number] }[],
        text: s.shade.text,
      }
    : null;

  // rota: arco quadrático com barriga para cima, tracejado que se desenha
  let route: null | { d: string; len: number; atF: number; label?: string; a: [number, number]; b: [number, number] } = null;
  if (s.route) {
    const a = m.project(s.route.from[0], s.route.from[1]);
    const b = m.project(s.route.to[0], s.route.to[1]);
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy);
    const nx = dy / dist;
    const ny = -dx / dist;
    const k = dist * 0.22 * (ny < 0 ? 1 : -1);
    const d = `M ${a[0]} ${a[1]} Q ${mx + nx * k} ${my + ny * k} ${b[0]} ${b[1]}`;
    route = { d, len: getLength(d), atF: sec(s.route.at ?? 0.6), label: s.route.label, a, b };
  }

  // foco da câmera: pinos > regiões > rota > centro
  const pts: [number, number][] = [
    ...pins.map((p) => p.xy),
    ...regions.map((r) => r.hit!.c),
    ...(shade ? shade.parts.map((p) => p.c) : []),
    ...(route ? [route.a, route.b] : []),
  ];
  const fx = pts.length ? pts.reduce((acc, p) => acc + p[0], 0) / pts.length : MW / 2;
  const fy = pts.length ? pts.reduce((acc, p) => acc + p[1], 0) / pts.length : MH / 2;
  const t = Math.min(1.3, frame / Math.max(1, dur));
  const zoom = 1 + (view === "americas" ? 0.08 : 0.13) * t;

  const sheetX = (W - MW) / 2;
  const sheetY = (H - MH) / 2 + 6;
  const focusScreen: [number, number] = [sheetX + fx, sheetY + fy];

  const routeP = route ? prog(frame, route.atF, route.atF + sec(1.4), EASE_OUT) : 0;
  let plane: null | { x: number; y: number; ang: number } = null;
  if (route && routeP > 0 && routeP < 1 && view === "americas") {
    const L = route.len * routeP;
    const pt = getPointAtLength(route.d, L);
    const tg = getTangentAtLength(route.d, L);
    if (pt && tg) plane = { x: pt.x, y: pt.y, ang: (Math.atan2(tg.y, tg.x) * 180) / Math.PI };
  }

  // rótulos de país que já aparecem como pino/rótulo da cena não se repetem
  const taken = new Set<string>([...(s.pins ?? []).map((p) => norm(p.name)), ...(s.label ? [norm(s.label.text)] : [])]);
  const labelSpec = s.label ?? (shade?.text ? { text: shade.text, kind: "number" as const, at: (s.shade?.at ?? 1) + 0.5 } : null);
  const lx = Math.min(W * 0.68, Math.max(W * 0.32, focusScreen[0]));
  const ly = Math.min(H * 0.8, Math.max(H * 0.28, focusScreen[1] + 150));

  return (
    <AbsoluteFill>
      <Board />
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: `${(focusScreen[0] / W) * 100}% ${(focusScreen[1] / H) * 100}%`,
          willChange: "transform",
        }}
      >
        <Placed x={W / 2} y={H / 2 + 6} rot={-0.8} at={0} dur={16}>
          <div
            style={{
              position: "relative",
              width: MW,
              height: MH,
              boxShadow: SHADOW_OBJ,
              overflow: "hidden",
            }}
          >
            {/* base do mapa (papel, mar, países, divisões) pré-renderizada em 2x: scripts/render.mjs maps */}
            <Img src={staticFile(`maps/${view}.jpg`)} style={{ position: "absolute", left: 0, top: 0, width: MW, height: MH }} />
            <svg width={MW} height={MH} style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern id={`hatch-${uid}`} patternUnits="userSpaceOnUse" width="11" height="11" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="11" stroke={C.red} strokeWidth="3.2" />
                </pattern>
              </defs>
              {/* território dominado */}
              {shade
                ? shade.parts.map((p, i) => {
                    const sp = prog(frame, shade.atF + i * 3, shade.atF + i * 3 + 14, EASE_OUT);
                    return (
                      <g key={i} opacity={sp}>
                        <path d={p.d} fill="rgba(201,35,27,0.30)" />
                        <path d={p.d} fill={`url(#hatch-${uid})`} opacity={0.55} />
                        <path d={p.d} fill="none" stroke={C.red} strokeWidth={2.2} />
                      </g>
                    );
                  })
                : null}
              {regions.map((r, i) => {
                const rp = prog(frame, r.atF, r.atF + 14, EASE_OUT);
                return (
                  <g key={i} opacity={rp}>
                    <path d={r.hit!.d} fill={`url(#hatch-${uid})`} opacity={0.5} />
                    <path d={r.hit!.d} fill="none" stroke={C.red} strokeWidth={2.6} />
                  </g>
                );
              })}
              {/* rótulos dos países */}
              {COUNTRY_LABELS[view].filter((l) => !taken.has(norm(l.t))).map((l, i) => {
                const [x, y] = m.project(l.lon, l.lat);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    style={{
                      fontFamily: FONT.type,
                      fontSize: l.big ? 40 : 24,
                      letterSpacing: l.big ? "0.5em" : "0.3em",
                      fill: l.faint ? "rgba(40,36,30,0.42)" : "rgba(33,31,27,0.78)",
                      fontStyle: l.faint && !l.big ? "italic" : "normal",
                    }}
                  >
                    {l.t}
                  </text>
                );
              })}
              {regions.map((r, i) => (
                <text
                  key={`rl${i}`}
                  x={r.hit!.c[0]}
                  y={r.hit!.c[1]}
                  textAnchor="middle"
                  opacity={prog(frame, r.atF + 8, r.atF + 16)}
                  style={{ fontFamily: FONT.type, fontSize: 26, letterSpacing: "0.12em", fill: C.ink, paintOrder: "stroke", stroke: "rgba(240,234,220,0.9)", strokeWidth: 5 }}
                >
                  {r.name.replace(/ Department$/i, "").replace(/^Département (de l'|de la |du |des )?/i, "").toUpperCase()}
                </text>
              ))}
              {route ? (
                <g>
                  <path
                    d={route.d}
                    fill="none"
                    stroke={C.red}
                    strokeWidth={4}
                    strokeDasharray="14 10"
                    strokeLinecap="round"
                    mask={`url(#rm-${uid})`}
                  />
                  <mask id={`rm-${uid}`}>
                    <path d={route.d} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray={route.len} strokeDashoffset={route.len * (1 - routeP)} />
                  </mask>
                  <circle cx={route.a[0]} cy={route.a[1]} r={8} fill={C.red} stroke="#f6efe2" strokeWidth={2.5} opacity={prog(frame, route.atF - 4, route.atF + 2)} />
                  {routeP >= 1 ? <circle cx={route.b[0]} cy={route.b[1]} r={9} fill={C.red} stroke="#f6efe2" strokeWidth={2.5} /> : null}
                  {plane ? (
                    <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.ang})`}>
                      <path d="M 18 0 L -10 -4 L -14 -16 L -19 -16 L -16 -3 L -24 -2 L -27 -8 L -30 -8 L -28 0 L -30 8 L -27 8 L -24 2 L -16 3 L -19 16 L -14 16 L -10 4 Z" fill="#1f1d1a" />
                    </g>
                  ) : null}
                  {route.label ? (
                    <text
                      x={(route.a[0] + route.b[0]) / 2}
                      y={Math.min(route.a[1], route.b[1]) - 46}
                      textAnchor="middle"
                      opacity={prog(frame, route.atF + 20, route.atF + 30)}
                      style={{ fontFamily: FONT.type, fontSize: 30, letterSpacing: "0.16em", fill: C.red, paintOrder: "stroke", stroke: "rgba(240,234,220,0.9)", strokeWidth: 6 }}
                    >
                      {route.label.toUpperCase()}
                    </text>
                  ) : null}
                </g>
              ) : null}
              {pins.map((p, i) => (
                <MapPinMark key={i} x={p.xy[0]} y={p.xy[1]} at={p.atF} name={p.name} sheetFrame={frame} />
              ))}
            </svg>
          </div>
        </Placed>
      </AbsoluteFill>
      {labelSpec ? <Label spec={labelSpec} x={lx} y={ly} align="center" maxWidth={900} tag /> : null}
    </AbsoluteFill>
  );
};
