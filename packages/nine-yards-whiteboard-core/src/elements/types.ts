import { Drawable } from "roughjs/bin/core";
import { Point } from "roughjs/bin/geometry";

import { ROUGHNESS, STROKE_WIDTH, RESIZE_HANDLE } from "./constants";

export type FillStyle = "empty" | "hachure" | "cross-hatch" | "solid";
export type Rounding = "proportional" | "fixed" | "sharp";
export type StrokeType = "solid" | "dashed" | "dotted" | "none";
export type StrokeWidth = (typeof STROKE_WIDTH)[keyof typeof STROKE_WIDTH];
export type Roughness = (typeof ROUGHNESS)[keyof typeof ROUGHNESS];
export type Arrowhead = "none" | "triangle" | "arrow";
export type TextAlign = "left" | "right" | "center";
export type FontFamily = "regular" | "monospace" | "typographic";

// Any fields that may potentially be mutated should be readonly to
// ensure all changes are properly tracked and versioned
type _DoodleElement = Readonly<{
  id: string;
  x: number;
  y: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: StrokeWidth;
  strokeType: StrokeType;
  roughness: Roughness;
  rounding: Rounding;
  opacity: number;
  width: number;
  height: number;
  rotation: number;
  seed: number;
  // This is a sequentially incremented integer used to resolve
  // conflicts when using a remote storage mechanism i.e the latest
  // version of the element always takes precedense
  version: number;
  // A fallback for the above versioning mechanism if the two
  // conflicting changes have matchin version numbers the nonce will
  // be used they're randomly generated, whichever is higher will be
  // accepted as the latest change to ensure deterministic
  // reconcilliation of updates during collaberation or similar
  versionNonce: number;
  // Timestamp of the last time the element was updated
  updated: number;
}>;

export type RectangleElement = _DoodleElement & {
  type: "rectangle";
};

export type TriangleElement = _DoodleElement &
  Readonly<{
    type: "triangle";
    // The offset of the tip of the triangle from the center (0) between
    // positive and negative 100 respectively both indicatig right angle
    // triangles
    shift: number;
  }>;

export type EllipseElement = _DoodleElement & {
  type: "ellipse";
};

export type LinearElement = _DoodleElement &
  Readonly<{
    type: "line";
    points: readonly Point[];
    startHead: Arrowhead;
    endHead: Arrowhead;
  }>;

export type TextElement = _DoodleElement &
  Readonly<{
    type: "text";
    text: string;
    textAlign: TextAlign;
    fontFamily: FontFamily;
  }>;

export type DoodleElement =
  | RectangleElement
  | TriangleElement
  | EllipseElement
  | LinearElement
  | TextElement;

export type DoodleElementOptions = Omit<
  Partial<DoodleElement>,
  "type" | "version" | "versionNonce" | "updated"
>;

export type ResizeUpdates = {
  x: DoodleElement["x"];
  y: DoodleElement["y"];
  width: DoodleElement["width"];
  height: DoodleElement["height"];
};

export type Shape = Drawable | Drawable[];

export type ResizeDirection =
  (typeof RESIZE_HANDLE)[keyof typeof RESIZE_HANDLE];

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type RawBounds = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  midX: number;
  midY: number;
  width: number;
  height: number;
}

export type TransformHandleType = ResizeDirection | "rotation";
export type TransformHandle = Bounds;

export type TransformHandles = Partial<{
  [T in TransformHandleType]: TransformHandle;
}>;
