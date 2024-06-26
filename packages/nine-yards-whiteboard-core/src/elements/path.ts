import { LINE_CONFIRM_THRESHOLD } from "./constants.js";
import { distance } from "../helpers/maths.js";

import type { Point } from "roughjs/bin/geometry.js";

export function isPathALoop(points: readonly Point[], zoomValue = 1): boolean {
  if (points.length < 3) {
    // The shape cannot possibly close with less than three points
    return false;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (!last || !first) {
    return false;
  }

  const ends = distance(first[0], first[1], last[0], last[1]);

  // Have this threshold relative to the zoom even to reduce visual noise
  // when zoomed out but ensure visual correctness when zoomed in
  return ends <= LINE_CONFIRM_THRESHOLD / zoomValue;
}
