// Mede o custo de preparar cada vista de mapa (projeção + caminhos SVG). uso: node scripts/bench_map.mjs
import { geoBounds, geoCentroid, geoMercator, geoPath } from "d3-geo";
import fs from "node:fs";
import { feature } from "topojson-client";

const worldTopo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const adm1 = JSON.parse(fs.readFileSync("src/data/geo/hti-adm1.json", "utf8"));
const adm3 = JSON.parse(fs.readFileSync("src/data/geo/hti-adm3.json", "utf8"));
const world = feature(worldTopo, worldTopo.objects.countries);
const VIEWS = { americas: [-93.5, 7.5, -60.5, 25.5], caribbean: [-86, 15.2, -64, 24.6], haiti: [-74.65, 17.9, -71.35, 20.15], pap: [-72.56, 18.43, -72.13, 18.67] };
const overlaps = (f, b) => {
  const [[w, s], [e, n]] = geoBounds(f);
  return !(e < b[0] - 2 || w > b[2] + 2 || n < b[1] - 2 || s > b[3] + 2);
};
for (const [view, b] of Object.entries(VIEWS)) {
  const t0 = performance.now();
  const proj = geoMercator().fitExtent([[40, 40], [1720, 950]], { type: "MultiPoint", coordinates: [[b[0], b[1]], [b[2], b[3]]] });
  const path = geoPath(proj);
  const t1 = performance.now();
  const ov = world.features.filter((f) => overlaps(f, b));
  const t2 = performance.now();
  const countries = ov.map((f) => path(f) ?? "");
  const t3 = performance.now();
  const detail = view === "pap" ? adm3 : adm1;
  const adm = detail.features.filter((f) => (view === "haiti" || view === "pap" ? overlaps(f, b) : false)).map((f) => path(f) ?? "");
  const t4 = performance.now();
  let n = 0;
  for (const f of [...adm1.features, ...adm3.features]) {
    proj(geoCentroid(f));
    n += (path(f) ?? "").length;
  }
  const t5 = performance.now();
  console.log(view, { fit: (t1 - t0) | 0, overlaps: (t2 - t1) | 0, countries: (t3 - t2) | 0, nCountries: ov.length, chars: countries.join("").length, adm: (t4 - t3) | 0, admChars: adm.join("").length, byName: (t5 - t4) | 0, byNameChars: n });
}
