import type { Point } from "roughjs/bin/geometry.js";

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const delta_x = x2 - x1;
  const delta_y = y2 - y1;
  return Math.hypot(delta_x, delta_y);
}

export function rotateAround(
  point: Point,
  radians: number,
  origin?: Point
): Point {
  if (!origin || isPointOrigin(origin)) {
    return rotate(point, radians);
  }

  const translatedX = point[0] - origin[0];
  const translatedY = point[1] - origin[1];

  const translatedPoint: Point = [translatedX, translatedY];
  const rotated = rotate(translatedPoint, radians);

  const returnedX = rotated[0] + origin[0];
  const returnedY = rotated[1] + origin[1];

  return [returnedX, returnedY];
}

export function rotate(point: Point, radians: number): Point {
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);

  return [point[0] * cos - point[1] * sin, point[0] * sin + point[1] * cos];
}

export function isPointOrigin(point: Point): boolean {
  return point[0] === 0 && point[1] === 0;
}

export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function centerPoint(a: Point, b: Point): Point {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
