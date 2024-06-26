import { DoodleElement } from "@/types";

export const ROUGHNESS = {
  none: 0,
  low: 1,
  high: 2,
} as const;

export const STROKE_WIDTH = {
  thick: 4,
  medium: 2,
  thin: 1,
} as const;

export const DEFAULT_FIXED_RADIUS = 32;
export const DEFAULT_PROPORTIONAL_RADIUS = 0.25;

export const LINE_CONFIRM_THRESHOLD = 8; // px
export const HANLDE_BUFFER = 7;

export const DEFAULT_ELEMENT_OPTIONS: Omit<
  DoodleElement,
  "type" | "id" | "seed" | "updated"
> = {
  x: 0,
  y: 0,
  width: 3,
  height: 3,
  strokeColor: "#000000",
  backgroundColor: "#ffddaa",
  fillStyle: "cross-hatch",
  strokeWidth: STROKE_WIDTH.medium,
  strokeType: "solid",
  roughness: ROUGHNESS.low,
  rounding: "fixed",
  opacity: 100,
  rotation: 0,
  version: 1,
  versionNonce: 1,
};

export const RESIZE_HANDLE = {
  NORTH: "n",
  EAST: "e",
  SOUTH: "s",
  WEST: "w",
  NORTH_WEST: "nw",
  NORTH_EAST: "ne",
  SOUTH_WEST: "sw",
  SOUTH_EAST: "se",
};

export const TRANSFORM_HANDLE = {
  ...RESIZE_HANDLE,
  ROTATION: "r",
};

export const ROTATION_SNAP = Math.PI / 12;

export const RESIZE_CURSORS = [
  "ns-resize",
  "nesw-resize",
  "ew-resize",
  "nwse-resize",
];
