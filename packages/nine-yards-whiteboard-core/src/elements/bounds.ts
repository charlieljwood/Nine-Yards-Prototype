import { Point } from "roughjs/bin/geometry";
import {
  Bounds,
  DoodleElement,
  ResizeDirection,
  TransformHandleType,
} from "./types";
import { rotateAround } from "@/helpers/maths";
import { testPointOverlap } from "./intersection";
import {
  RESIZE_CURSORS,
  RESIZE_HANDLE,
  ROTATION_OFFSET,
  TRANSFORM_HANDLE,
} from "..";
import { CURSOR_TYPE } from "@/constants";

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

export function testRotationHandle(point: Point, bounds: Bounds): boolean {
  const handleX = bounds.x + bounds.width / 2;
  const handleY = bounds.y + ROTATION_OFFSET;

  const rotationHandle: Point = [handleX, handleY];

  if (bounds.rotation !== 0) {
    const originY = bounds.y + bounds.height / 2;
    const origin: Point = [handleX, originY];

    point = rotateAround(point, -bounds.rotation, origin);
  }

  return testPointOverlap(point, rotationHandle);
}

export function testTransformHandles(
  point: Point,
  bounds: Bounds
): TransformHandleType | null {
  if (bounds.rotation !== 0) {
    const originX = bounds.x + bounds.width / 2;
    const originY = bounds.y + bounds.height / 2;

    const origin: Point = [originX, originY];

    point = rotateAround(point, -bounds.rotation, origin);
  }

  const rotationHandleX = bounds.x + bounds.width / 2;
  const rotationHandleY = bounds.y - ROTATION_OFFSET;

  const rotationHandle: Point = [rotationHandleX, rotationHandleY];

  if (testPointOverlap(point, rotationHandle)) {
    return TRANSFORM_HANDLE.ROTATION;
  }

  const crossHandle = testCrossHandles(point, bounds);

  if (crossHandle !== null) {
    return crossHandle;
  }

  const cardinalHandle = testCardinalHandles(point, bounds);

  if (cardinalHandle !== null) {
    return cardinalHandle;
  }

  return null;
}

function testCardinalHandles(
  point: Point,
  bounds: Bounds
): ResizeDirection | null {
  const [x, y] = point;

  const lowerX = bounds.x;
  const upperX = bounds.x + bounds.width;

  const lowerY = bounds.y;
  const upperY = bounds.y + bounds.height;

  if (x > lowerX && x < upperX) {
    if (y > lowerY - 3 && y < lowerY + 3) {
      return RESIZE_HANDLE.NORTH;
    }

    if (y > upperY - 3 && y < upperY + 3) {
      return RESIZE_HANDLE.SOUTH;
    }
  }

  if (y > lowerY && y < upperY) {
    if (x > lowerX - 3 && x < lowerX + 3) {
      return RESIZE_HANDLE.WEST;
    }

    if (x > upperX - 3 && x < upperX + 3) {
      return RESIZE_HANDLE.EAST;
    }
  }

  return null;
}

function testCrossHandles(
  point: Point,
  bounds: Bounds
): ResizeDirection | null {
  const nw: Point = [bounds.x, bounds.y];

  if (testPointOverlap(point, nw)) {
    return RESIZE_HANDLE.NORTH_WEST;
  }

  const ne: Point = [bounds.x + bounds.width, bounds.y];

  if (testPointOverlap(point, ne)) {
    return RESIZE_HANDLE.NORTH_EAST;
  }

  const sw: Point = [bounds.x, bounds.y + bounds.height];

  if (testPointOverlap(point, sw)) {
    return RESIZE_HANDLE.SOUTH_WEST;
  }

  const se: Point = [bounds.x + bounds.width, bounds.y + bounds.height];

  if (testPointOverlap(point, se)) {
    return RESIZE_HANDLE.SOUTH_EAST;
  }

  return null;
}

export function cursorTypeForHandle(
  handle: TransformHandleType,
  rotation?: number
): string {
  let cursor = null;

  switch (handle) {
    case "n":
    case "s":
      cursor = "ns-resize";
      break;
    case "w":
    case "e":
      cursor = "ew-resize";
      break;
    case "nw":
    case "se":
      cursor = "nwse-resize";
      break;
    case "ne":
    case "sw":
      cursor = "nesw-resize";
      break;
    default:
      return "grab";
  }

  if (cursor && rotation) {
    cursor = rotateResizeCursor(cursor, rotation);
  }

  return cursor ?? CURSOR_TYPE.AUTO;
}

function rotateResizeCursor(cursor: string, angle: number): string {
  const index = RESIZE_CURSORS.indexOf(cursor);

  if (index === -1) {
    return cursor;
  }

  const angleOffset = Math.round(angle / (Math.PI / 4));

  const rotatedIndex = (index + angleOffset) % RESIZE_CURSORS.length;
  return RESIZE_CURSORS[rotatedIndex];
}
