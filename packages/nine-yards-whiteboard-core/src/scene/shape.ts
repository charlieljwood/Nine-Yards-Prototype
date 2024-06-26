import type { RoughGenerator } from "roughjs/bin/generator";
import type { Options } from "roughjs/bin/core";

import {
  DEFAULT_FIXED_RADIUS,
  DEFAULT_PROPORTIONAL_RADIUS,
  ROUGHNESS,
} from "@/elements/constants";
import { isPathALoop } from "@/elements/path";
import type { Shape } from "@/scene/types";
import type {
  DoodleElement,
  EllipseElement,
  RectangleElement,
  TriangleElement,
} from "@/elements/types";

export function generateShapePath(
  element: DoodleElement,
  generator: RoughGenerator,
  continuousPath = false
): Shape | null {
  const options: Options = {
    seed: element.seed,
    strokeLineDash: elementStrokePattern(element),
    disableMultiStroke: element.strokeType !== "solid",
    strokeWidth:
      element.strokeType !== "solid"
        ? element.strokeWidth + 0.5
        : element.strokeWidth,
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    roughness: adjustRoughness(element),
    stroke: element.strokeColor,
    preserveVertices: continuousPath || element.roughness < ROUGHNESS.high,
  };

  if (element.type !== "line" || isPathALoop(element.points)) {
    options.fillStyle = element.fillStyle;
    options.fill = element.backgroundColor;
  }

  switch (element.type) {
    case "rectangle":
      return generateRectangleElement(element, options, generator);
    case "ellipse":
      options.curveFitting = 1;
      return generateEllipseShape(element, options, generator);
    case "triangle":
      return generateTriangleShape(element, options, generator);
  }

  return null;
}

function elementStrokePattern(element: DoodleElement): number[] | undefined {
  if (element.strokeType === "dashed") {
    return [8, 8 + element.strokeWidth];
  }

  if (element.strokeType === "dotted") {
    return [1.5, 6 + element.strokeWidth];
  }

  return undefined;
}

function adjustRoughness(element: DoodleElement): number {
  const { roughness, width, height } = element;

  const maxSize = Math.max(width, height);
  const minSize = Math.min(width, height);

  if (minSize >= 20 && maxSize >= 50) {
    return roughness;
  }

  const roughnessMinimizer = maxSize < 10 ? 3 : 2;
  return Math.min(roughness / roughnessMinimizer, 2.5);
}

function calculateCornerRadius(element: DoodleElement): number {
  const shortest = Math.min(element.width, element.height);

  if (element.rounding === "proportional") {
    return shortest * DEFAULT_PROPORTIONAL_RADIUS;
  }

  if (element.rounding === "fixed") {
    const cutoff = DEFAULT_FIXED_RADIUS / DEFAULT_PROPORTIONAL_RADIUS;

    // If at least one dimension of the element cannot
    // comfortably fit a fixed radius revert back to
    // the proportional radius to prevent visual bugs
    if (shortest <= cutoff) {
      return shortest * DEFAULT_PROPORTIONAL_RADIUS;
    }

    return DEFAULT_FIXED_RADIUS;
  }

  return 0;
}

function generateRectangleElement(
  element: RectangleElement,
  options: Options,
  generator: RoughGenerator
): Shape {
  const { width, height } = element;

  if (element.rounding === "sharp") {
    return generator.rectangle(0, 0, width, height, options);
  }

  const radius = calculateCornerRadius(element);

  const shape = `M ${radius} 0 L ${width - radius} 0 Q ${width} 0, ${width}
                ${radius} L ${width} ${height - radius} Q ${width} ${height},
                ${width - radius} ${height} L ${radius} ${height} Q 0
                ${height}, 0 ${height - radius} L 0 ${radius} Q 0 0, ${radius} 0`;

  return generator.path(shape, options);
}

function generateEllipseShape(
  element: EllipseElement,
  options: Options,
  generator: RoughGenerator
): Shape {
  const { width, height } = element;

  return generator.ellipse(width / 2, height / 2, width, height, options);
}

function generateTriangleShape(
  element: TriangleElement,
  options: Options,
  generator: RoughGenerator
): Shape {
  const { width, height, shift } = element;

  let shape: string;

  if (element.rounding === "sharp" || width === 0 || height === 0) {
    shape = `M ${width * shift} 0 L 0 ${height} ${width} ${height} Z`;
  } else {
    const radius = calculateCornerRadius(element);

    const leftAngle = Math.atan(height / (shift * width));
    const controlLeftX = radius * Math.cos(leftAngle);
    const controlLeftY = radius * Math.sin(leftAngle);

    const rightAngle = Math.atan(height / ((1 - shift) * width));
    const controlRightX = radius * Math.cos(rightAngle);
    const controlRightY = radius * Math.sin(rightAngle);

    const topAngleLeft = Math.PI * 0.5 - leftAngle;
    const topAngleRight = Math.PI * 0.5 - rightAngle;

    const topRightOffsetX = radius * Math.sin(topAngleRight);
    const topRightOffsetY = radius * Math.cos(topAngleRight);

    const topLeftOffsetX = radius * Math.sin(topAngleLeft);
    const topLeftOffsetY = radius * Math.cos(topAngleLeft);

    shape = `M ${radius} ${height}
            Q 0 ${height} ${controlLeftX} ${height - controlLeftY}
            L ${width * shift - topLeftOffsetX} ${topLeftOffsetY}
            Q ${width * shift} 0 ${width * shift + topRightOffsetX} ${topRightOffsetY}
            L ${width - controlRightX} ${height - controlRightY}
            Q ${width} ${height} ${width - controlRightX} ${height} Z`;
  }

  return generator.path(shape, options);
}
