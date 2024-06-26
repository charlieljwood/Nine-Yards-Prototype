import { distance, rotateAround } from "@/helpers/maths";
import { Point } from "roughjs/bin/geometry";
import {
  Bounds,
  DoodleElement,
  EllipseElement,
  TriangleElement,
} from "./types";
import { TRANSFORM_POINT_THRESHOLD } from "@/base/constants";

export function testElement(point: Point, element: DoodleElement): boolean {
  switch (element.type) {
    case "rectangle":
    case "text":
      return testElementBoundingBox(point, element);

    case "ellipse":
      return testEllipseElement(point, element);

    case "triangle":
      return testTriangleElement(point, element);
  }

  return false;
}

export function testElementBoundingBox(
  point: Point,
  element: DoodleElement
): boolean {
  return testRectangle(
    point,
    element.x,
    element.y,
    element.width,
    element.height,
    element.rotation
  );
}

export function testBoundingBox(point: Point, boundingBox: Bounds): boolean {
  return testRectangle(
    point,
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height,
    boundingBox.rotation
  );
}

export function testRectangle(
  point: Point,
  x: number,
  y: number,
  width: number,
  height: number,
  radians?: number
): boolean {
  let resolvedPoint = point;

  if (radians) {
    const origin: Point = [x + width / 2, y + height / 2];
    resolvedPoint = rotateAround(point, -radians, origin);
  }

  const xValid = resolvedPoint[0] > x && resolvedPoint[0] < x + width;
  const yValid = resolvedPoint[1] > y && resolvedPoint[1] < y + height;

  return xValid && yValid;
}

export function testEllipseElement(
  point: Point,
  element: EllipseElement
): boolean {
  const resolvedPoint = mapPoint(point, element);

  let [x, y] = resolvedPoint;

  x -= element.x + element.width / 2;
  y -= element.y + element.height / 2;

  const radiusX = element.width / 2;
  const radiusY = element.height / 2;

  return (x / radiusX) * (x / radiusX) + (y / radiusY) * (y / radiusY) <= 1;
}

export function testTriangleElement(
  point: Point,
  element: TriangleElement
): boolean {
  const resolvedPoint = mapPoint(point, element);

  const [x, y] = resolvedPoint;

  const x1 = element.x + element.width * element.shift;
  const y1 = element.y;

  const x2 = element.x;
  const y2 = element.y + element.height;

  const x3 = element.x + element.width;
  const y3 = element.y + element.height;

  const b1 = (x1 - x3) * (y - y3) - (y1 - y3) * (x - x3);
  const b2 = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);

  if (b1 < 0 !== b2 < 0 && b1 !== 0 && b2 !== 0) {
    return false;
  }

  const d = (x3 - x2) * (y - y2) - (y3 - y2) * (x - x2);
  return d == 0 || d < 0 == b1 + b2 <= 0;
}

export function testPointOverlap(
  point: Point,
  subject: Point,
  threshold = TRANSFORM_POINT_THRESHOLD
): boolean {
  return distance(point[0], point[1], subject[0], subject[1]) <= threshold;
}

function mapPoint(point: Point, element: DoodleElement): Point {
  if (element.rotation === 0) {
    return point;
  }

  const { x, y, width, height, rotation } = element;

  const origin: Point = [x + width / 2, y + height / 2];
  return rotateAround(point, -rotation, origin);
}

export function calculateBounds(
  elements: readonly DoodleElement[]
): Bounds | null {
  if (elements.length === 0) {
    return null;
  }

  if (elements.length === 1) {
    const element = elements[0];
    const { width, height, x, y, rotation } = element;

    return { width, height, x, y, rotation };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const x1 = element.x;
    const x2 = element.x + element.width;
    const y1 = element.y;
    const y2 = element.y + element.height;

    minX = Math.min(minX, x1);
    maxX = Math.max(maxX, x2);

    minY = Math.min(minY, y1);
    maxY = Math.max(maxY, y2);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  return { x: minX, y: minY, width, height, rotation: 0 };
}
