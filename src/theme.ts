import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadSpecialElite } from "@remotion/google-fonts/SpecialElite";

// Google Fonts: máquina de escrever (rótulos), condensada (números/datas/títulos), marcador (polaroid)
const typewriter = loadSpecialElite("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const condensed = loadOswald("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
const marker = loadMarker("normal", { weights: ["400"], subsets: ["latin"] });

export const FONT = {
  type: typewriter.fontFamily,
  cond: condensed.fontFamily,
  hand: marker.fontFamily,
};

export const C = {
  board: "#121212",
  paper: "#ECE6D6",
  polaroid: "#F1EEE6",
  ink: "#211F1B",
  inkSoft: "#4A453D",
  red: "#C9231B",
  redBright: "#E2362B",
  redNeon: "#FF5A4A",
  white: "#F5F0E6",
  tape: "rgba(231, 222, 196, 0.80)",
};

// Neon bem leve (pedido do usuário): brilho curto e suave, sem halo grande.
export const GLOW_WHITE =
  "0 0 1px rgba(255,250,242,0.85), 0 0 6px rgba(255,244,228,0.38), 0 0 16px rgba(255,236,214,0.18)";
export const GLOW_RED =
  "0 0 1px rgba(255,120,100,0.9), 0 0 7px rgba(255,70,52,0.48), 0 0 18px rgba(255,44,30,0.24)";

export const SHADOW_OBJ = "0 22px 44px rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.45)";
