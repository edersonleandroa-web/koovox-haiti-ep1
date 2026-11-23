// Render pelas APIs Node do Remotion (usado no GitHub Actions e localmente).
//
//   node scripts/render.mjs chunk <i> <n>          -> out/chunks/chunk-<i>.mp4 (só vídeo, quadros do pedaço i de n)
//   node scripts/render.mjs audio                  -> out/audio.wav (mixagem completa: voz + trilha + efeitos)
//   node scripts/render.mjs stills <f1,f2,...> [escala] [pasta]   -> JPGs para revisão
//   node scripts/render.mjs info                   -> duração total e limites dos pedaços
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [, , mode, a1, a2, a3] = process.argv;
const ID = "Haiti";

const t0 = Date.now();
const log = (...m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...m);

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), rspack: true });
log("bundle ok");
const composition = await selectComposition({ serveUrl, id: ID });
const total = composition.durationInFrames;
const threads = os.cpus().length;

const progress = (label) => {
  let last = -1;
  return ({ progress: p }) => {
    const pc = Math.floor(p * 100);
    if (pc >= last + 5) {
      last = pc;
      log(`${label} ${pc}%`);
    }
  };
};

if (mode === "info") {
  console.log(JSON.stringify({ total, fps: composition.fps, seconds: total / composition.fps }));
} else if (mode === "chunk") {
  const i = Number(a1);
  const n = Number(a2);
  const size = Math.ceil(total / n);
  const start = i * size;
  const end = Math.min(total - 1, (i + 1) * size - 1);
  fs.mkdirSync("out/chunks", { recursive: true });
  const out = `out/chunks/chunk-${String(i).padStart(2, "0")}.mp4`;
  log(`pedaço ${i + 1}/${n}: quadros ${start}-${end} de ${total}`);
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: out,
    frameRange: [start, end],
    muted: true,
    crf: 20,
    x264Preset: "medium",
    imageFormat: "jpeg",
    jpegQuality: 92,
    pixelFormat: "yuv420p",
    concurrency: threads,
    timeoutInMilliseconds: 120000,
    onProgress: progress(`pedaço ${i}`),
  });
  log("ok", out);
} else if (mode === "audio") {
  fs.mkdirSync("out", { recursive: true });
  await renderMedia({
    serveUrl,
    composition,
    codec: "wav",
    outputLocation: "out/audio.wav",
    concurrency: threads,
    timeoutInMilliseconds: 120000,
    onProgress: progress("áudio"),
  });
  log("ok out/audio.wav");
} else if (mode === "maps") {
  // base estática de cada vista de mapa, em 2x, para a cena de mapa só animar pinos/rotas por cima
  fs.mkdirSync("public/maps", { recursive: true });
  for (const view of (a1 ? a1.split(",") : ["americas", "caribbean", "haiti", "pap"])) {
    const comp = await selectComposition({ serveUrl, id: "MapBase", inputProps: { view } });
    await renderStill({ serveUrl, composition: comp, inputProps: { view }, frame: 0, output: `public/maps/${view}.jpg`, imageFormat: "jpeg", jpegQuality: 92, scale: 2, timeoutInMilliseconds: 300000 });
    log("mapa", view);
  }
} else if (mode === "stills") {
  const frames = String(a1 ?? "0")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
  const scale = Number(a2 ?? 0.5);
  const dir = a3 ?? "out/stills";
  fs.mkdirSync(dir, { recursive: true });
  for (const f of frames) {
    const frame = Math.max(0, Math.min(total - 1, f));
    await renderStill({ serveUrl, composition, frame, output: `${dir}/f${String(frame).padStart(6, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale });
    log("still", frame);
  }
} else {
  console.error("modo desconhecido:", mode);
  process.exit(1);
}
