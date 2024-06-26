import type { DoodleElement } from "./src/types";
import { ROUGHNESS, STROKE_WIDTH } from "./src/elements/constants";

export const FIXTURE_DATA: DoodleElement[] = [
  {
    type: "rectangle",
    id: "1",
    x: 10,
    y: 10,
    strokeColor: "#2a2a2a",
    backgroundColor: "#ff3934",
    fillStyle: "hachure",
    strokeWidth: STROKE_WIDTH.medium,
    strokeType: "solid",
    roughness: ROUGHNESS.low,
    rounding: "fixed",
    opacity: 100,
    width: 100,
    height: 200,
    rotation: 0,
    seed: 100,
    version: 1,
    versionNonce: 1,
    updated: 0,
  },
  {
    type: "ellipse",
    id: "1",
    x: 300,
    y: 300,
    strokeColor: "#2a2a2a",
    backgroundColor: "#ddffaa",
    fillStyle: "hachure",
    strokeWidth: STROKE_WIDTH.thin,
    strokeType: "dashed",
    roughness: ROUGHNESS.low,
    rounding: "fixed",
    opacity: 100,
    width: 120,
    height: 120,
    rotation: 0,
    seed: 100,
    version: 1,
    versionNonce: 1,
    updated: 0,
  },
  {
    type: "rectangle",
    id: "3",
    x: 200,
    y: -100,
    strokeColor: "#3a3a3a",
    backgroundColor: "#ffddaa",
    fillStyle: "hachure",
    strokeWidth: STROKE_WIDTH.medium,
    strokeType: "solid",
    roughness: ROUGHNESS.none,
    rounding: "fixed",
    opacity: 100,
    width: 120,
    height: 120,
    rotation: 45,
    seed: 100,
    version: 1,
    versionNonce: 1,
    updated: 0,
  },
  {
    type: "rectangle",
    id: "3",
    x: 200,
    y: -100,
    strokeColor: "#3a3a3a",
    backgroundColor: "#ffddaa",
    fillStyle: "hachure",
    strokeWidth: STROKE_WIDTH.medium,
    strokeType: "solid",
    roughness: ROUGHNESS.none,
    rounding: "fixed",
    opacity: 100,
    width: 120,
    height: 120,
    rotation: 0,
    seed: 100,
    version: 1,
    versionNonce: 1,
    updated: 0,
  },
];
