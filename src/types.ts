// Contrato das cenas (ver docs/ESPEC-ROTEIRO.md). Os JSONs de src/data/scenes seguem este formato.

export type Grade = "bw" | "warm" | "cold" | "none";

export type MediaRef = {
  src: string | null;
  kind?: "image" | "video";
  trim?: number;
  focus?: [number, number];
  grade?: Grade;
  credit?: string;
  want?: string;
  cutout?: string; // PNG com fundo removido (Canva), para a cena de pessoa recortada
};

export type LabelKind = "place" | "name" | "date" | "number" | "info";

export type LabelSpec = {
  text: string;
  sub?: string;
  at?: number;
  kind?: LabelKind;
};

export type SfxSpec = { name: string; at?: number; volume?: number };

export type TransitionType = "whip" | "zoom" | "flash" | "glitch" | "fade" | "cut";

type Base = {
  id: string;
  start: number;
  end: number;
  transition?: TransitionType;
  label?: LabelSpec;
  sfx?: SfxSpec[];
  note?: string;
};

export type PhotoScene = Base & {
  type: "photo";
  media: MediaRef;
  frame?: "polaroid" | "print" | "clipping" | "tv";
  caption?: string;
};
export type FullScene = Base & {
  type: "full";
  media: MediaRef;
  move?: "in" | "out" | "left" | "right";
};
export type PersonScene = Base & {
  type: "person";
  media: MediaRef | null;
  name: string;
  role?: string;
  years?: string;
};
export type BoardItem = { media: MediaRef | null; name: string; at?: number };
export type DuoScene = Base & {
  type: "duo";
  items: BoardItem[];
  link?: string;
};
export type NetworkScene = Base & {
  type: "network";
  items: BoardItem[];
  center?: string;
};
export type MapPin = { name: string; lon: number; lat: number; at?: number };
export type MapView = "americas" | "caribbean" | "haiti" | "pap";
export type MapScene = Base & {
  type: "map";
  view: MapView;
  pins?: MapPin[];
  route?: { from: [number, number]; to: [number, number]; at?: number; label?: string };
  regions?: { name: string; at?: number }[];
  shade?: { communes: string[]; at?: number; text?: string };
};
export type StatScene = Base & {
  type: "stat";
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  text?: string;
  media?: MediaRef | null;
};
export type DateScene = Base & { type: "date"; text: string; sub?: string; media?: MediaRef | null };
export type TimelineScene = Base & {
  type: "timeline";
  years: { year: string; text?: string }[];
  focus?: number;
};
export type DocScene = Base & { type: "doc"; title: string; stamp?: string; stampAt?: number; media?: MediaRef | null };
export type HeadlineScene = Base & {
  type: "headline";
  headline: string;
  date?: string;
  media?: MediaRef | null;
};
export type LogoScene = Base & { type: "logo" };

export type Scene =
  | PhotoScene
  | FullScene
  | PersonScene
  | DuoScene
  | NetworkScene
  | MapScene
  | StatScene
  | DateScene
  | TimelineScene
  | DocScene
  | HeadlineScene
  | LogoScene;

export type ChapterData = {
  chapter: string;
  audio: string;
  duration: number;
  scenes: Scene[];
};
