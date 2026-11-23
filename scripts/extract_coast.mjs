// Extrai do Natural Earth 10m (world-atlas) só os países perto do Haiti, para os mapas aproximados
// (litoral bem mais fiel que o 50m).  uso: node scripts/extract_coast.mjs
import fs from "node:fs";
import { feature } from "topojson-client";

const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const fc = feature(topo, topo.objects.countries);
const KEEP = new Set(["332", "214", "192", "388"]); // Haiti, Rep. Dominicana, Cuba, Jamaica
const out = { type: "FeatureCollection", features: fc.features.filter((f) => KEEP.has(String(f.id))).map((f) => ({ ...f, id: String(f.id) })) };
// arredonda coordenadas (5 casas ≈ 1 m) para o arquivo ficar menor
const round = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5] : c.map(round));
for (const f of out.features) f.geometry.coordinates = round(f.geometry.coordinates);
fs.writeFileSync("src/data/geo/hispaniola-10m.json", JSON.stringify(out));
console.log(out.features.map((f) => f.properties.name), fs.statSync("src/data/geo/hispaniola-10m.json").size, "bytes");
