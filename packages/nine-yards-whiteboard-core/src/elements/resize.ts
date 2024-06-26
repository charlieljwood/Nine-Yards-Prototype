import { ElementGroup } from "@/helpers/group";
import {
  DoodleElement,
  ResizeDirection,
  TransformHandleType,
  Whiteboard,
} from "..";
import { centerPoint, rotateAround } from "@/helpers/maths";
import { Point } from "roughjs/bin/geometry";

export function resizeElements(
  whiteboard: Whiteboard,
  handle: TransformHandleType,
  group: ElementGroup
): void {
  const elements = group.elements;

  if (elements.length === 1) {
    const [element] = elements;
    resizeSingleElement(whiteboard, handle, element, group);

    return;
  }

  if (elements.length > 1) {
    resizeMultipleElements(whiteboard, handle, group);
    return;
  }
}

export type OtherBounds = readonly [
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
];

function getResizedElementAbsoluteCoords(
  element: DoodleElement,
  nextWidth: number,
  nextHeight: number
): OtherBounds {
  return [element.x, element.y, element.x + nextWidth, element.y + nextHeight];
}

function normalizeAngle(angle: number): number {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }
  if (angle >= 2 * Math.PI) {
    return angle - 2 * Math.PI;
  }
  return angle;
}

function resizeMultipleElements(
  whiteboard: Whiteboard,
  handle: ResizeDirection,
  group: ElementGroup
): void {
  const { scrollX, scrollY, zoom } = whiteboard.getViewport();

  const bounds = group.bounds;

  if (!bounds) {
    return;
  }

  const elements = group.elements;
  const originalElements = new Map(
    elements.map(element => [element.id, structuredClone(element)])
  );

  const minX = bounds.x;
  const minY = bounds.y;
  const maxX = bounds.x + bounds.width;
  const maxY = bounds.y + bounds.height;
  const width = bounds.width;
  const height = bounds.height;

  const anchorsMap: Record<ResizeDirection, Point> = {
    ne: [minX, maxY],
    se: [minX, minY],
    sw: [maxX, minY],
    nw: [maxX, maxY],
    e: [minX, minY + height / 2],
    w: [maxX, minY + height / 2],
    n: [minX + width / 2, maxY],
    s: [minX + width / 2, minY],
  };

  const [anchorX, anchorY]: Point = anchorsMap[handle];

  const onPointerMove = (event: PointerEvent) => {
    const { clientX, clientY } = event;

    const pointerX = clientX / zoom - scrollX;
    const pointerY = clientY / zoom - scrollY;

    const scale = Math.max(
      Math.abs(pointerX - anchorX) / width || 0,
      Math.abs(pointerY - anchorY) / height || 0
    );

    if (scale === 0) {
      return;
    }

    const scaleX =
      handle.includes("e") || handle.includes("w")
        ? Math.abs(pointerX - anchorX) / width
        : 1;
    const scaleY =
      handle.includes("n") || handle.includes("s")
        ? Math.abs(pointerY - anchorY) / height
        : 1;

    const flipConditionsMap: Record<
      ResizeDirection,
      // Condition for which we should flip or not flip the selected elements
      // - when evaluated to `true`, we flip
      // - therefore, setting it to always `false` means we do not flip (in that direction) at all
      [x: boolean, y: boolean]
    > = {
      ne: [pointerX < anchorX, pointerY > anchorY],
      se: [pointerX < anchorX, pointerY < anchorY],
      sw: [pointerX > anchorX, pointerY < anchorY],
      nw: [pointerX > anchorX, pointerY > anchorY],
      // e.g. when resizing from the "e" side, we do not need to consider changes in the `y` direction
      //      and therefore, we do not need to flip in the `y` direction at all
      e: [pointerX < anchorX, false],
      w: [pointerX > anchorX, false],
      n: [false, pointerY > anchorY],
      s: [false, pointerY < anchorY],
    };

    /**
     * to flip an element:
     * 1. determine over which axis is the element being flipped
     *    (could be x, y, or both) indicated by `flipFactorX` & `flipFactorY`
     * 2. shift element's position by the amount of width or height (or both) or
     *    mirror points in the case of linear & freedraw elemenets
     * 3. adjust element angle
     */
    const [flipFactorX, flipFactorY] = flipConditionsMap[handle].map(
      condition => (condition ? -1 : 1)
    );
    const isFlippedByX = flipFactorX < 0;
    const isFlippedByY = flipFactorY < 0;

    whiteboard.mutateElements(
      elements,
      element => {
        const orig = originalElements.get(element.id);

        if (!orig) {
          return element;
        }

        const width = orig.width * scaleX;
        const height = orig.height * scaleY;
        const angle = normalizeAngle(orig.rotation * flipFactorX * flipFactorY);

        const offsetX = orig.x - anchorX;
        const offsetY = orig.y - anchorY;
        const shiftX = isFlippedByX ? width : 0;
        const shiftY = isFlippedByY ? height : 0;

        const x = anchorX + flipFactorX * (offsetX * scaleX + shiftX);
        const y = anchorY + flipFactorY * (offsetY * scaleY + shiftY);

        return {
          ...element,
          x,
          y,
          width,
          height,
          angle,
        };
      },
      false
    );

    group.clearBounds();
  };

  const onPointerUp = (): void => {
    whiteboard.notifyElementMutation(true);
  };

  whiteboard.handleDragEvent(onPointerMove, onPointerUp);
}

export function resizeSingleElement(
  whiteboard: Whiteboard,
  handle: ResizeDirection,
  element: DoodleElement,
  group?: ElementGroup
): void {
  const { zoom, scrollX, scrollY } = whiteboard.getViewport();

  const initialState = element;
  const rotation = initialState.rotation;

  const [x1, y1, x2, y2] = getResizedElementAbsoluteCoords(
    initialState,
    initialState.width,
    initialState.height
  );

  const initialTopLeft: Point = [x1, y1];
  const initialBottomRight: Point = [x2, y2];
  const initialCenter: Point = centerPoint(initialTopLeft, initialBottomRight);

  const onPointerMove = (event: PointerEvent) => {
    const { clientX, clientY } = event;

    const rawPointerX = clientX / zoom - scrollX;
    const rawPointerY = clientY / zoom - scrollY;

    const rawPointer: Point = [rawPointerX, rawPointerY];

    const rotatedPointer = rotateAround(rawPointer, -rotation, initialCenter);

    // Get bounds corners rendered on screen
    const [esx1, esy1, esx2, esy2] = getResizedElementAbsoluteCoords(
      element,
      element.width,
      element.height
    );

    const boundsCurrentWidth = esx2 - esx1;
    const boundsCurrentHeight = esy2 - esy1;

    // It's important we set the initial scale value based on the width and height at resize start,
    // otherwise previous dimensions affected by modifiers will be taken into account.
    const atStartBoundsWidth = initialBottomRight[0] - initialTopLeft[0];
    const atStartBoundsHeight = initialBottomRight[1] - initialTopLeft[1];
    let scaleX = atStartBoundsWidth / boundsCurrentWidth;
    let scaleY = atStartBoundsHeight / boundsCurrentHeight;

    if (handle.includes("e")) {
      scaleX = (rotatedPointer[0] - initialTopLeft[0]) / boundsCurrentWidth;
    }
    if (handle.includes("s")) {
      scaleY = (rotatedPointer[1] - initialTopLeft[1]) / boundsCurrentHeight;
    }
    if (handle.includes("w")) {
      scaleX = (initialBottomRight[0] - rotatedPointer[0]) / boundsCurrentWidth;
    }
    if (handle.includes("n")) {
      scaleY =
        (initialBottomRight[1] - rotatedPointer[1]) / boundsCurrentHeight;
    }

    // We have to use dimensions of element on screen, otherwise the scaling of the
    // dimensions won't match the cursor for linear elements.
    const eleNewWidth = element.width * scaleX;
    const eleNewHeight = element.height * scaleY;

    const [newBoundsX1, newBoundsY1, newBoundsX2, newBoundsY2] =
      getResizedElementAbsoluteCoords(initialState, eleNewWidth, eleNewHeight);
    const newBoundsWidth = newBoundsX2 - newBoundsX1;
    const newBoundsHeight = newBoundsY2 - newBoundsY1;

    // Calculate new topLeft based on fixed corner during resize
    let newTopLeft = [...initialTopLeft] as [number, number];

    if (["n", "w", "nw"].includes(handle)) {
      newTopLeft = [
        initialBottomRight[0] - Math.abs(newBoundsWidth),
        initialBottomRight[1] - Math.abs(newBoundsHeight),
      ];
    }

    if (handle === "ne") {
      const bottomLeft = [initialTopLeft[0], initialBottomRight[1]];
      newTopLeft = [bottomLeft[0], bottomLeft[1] - Math.abs(newBoundsHeight)];
    }

    if (handle === "sw") {
      const topRight = [initialBottomRight[0], initialTopLeft[1]];
      newTopLeft = [topRight[0] - Math.abs(newBoundsWidth), topRight[1]];
    }

    const flipX = eleNewWidth < 0;
    const flipY = eleNewHeight < 0;

    // Flip horizontally
    if (flipX) {
      if (handle.includes("e")) {
        newTopLeft[0] -= Math.abs(newBoundsWidth);
      }
      if (handle.includes("w")) {
        newTopLeft[0] += Math.abs(newBoundsWidth);
      }
    }

    // Flip vertically
    if (flipY) {
      if (handle.includes("s")) {
        newTopLeft[1] -= Math.abs(newBoundsHeight);
      }
      if (handle.includes("n")) {
        newTopLeft[1] += Math.abs(newBoundsHeight);
      }
    }

    const rotatedTopLeft = rotateAround(newTopLeft, rotation, initialCenter);
    const newCenter: Point = [
      newTopLeft[0] + Math.abs(newBoundsWidth) / 2,
      newTopLeft[1] + Math.abs(newBoundsHeight) / 2,
    ];
    const rotatedNewCenter = rotateAround(newCenter, rotation, initialCenter);
    newTopLeft = rotateAround(rotatedTopLeft, -rotation, rotatedNewCenter);

    const nextX = newTopLeft[0];
    const nextY = newTopLeft[1];

    const resizedElement = {
      width: Math.abs(eleNewWidth),
      height: Math.abs(eleNewHeight),
      x: nextX,
      y: nextY,
    };

    if (
      resizedElement.width !== 0 &&
      resizedElement.height !== 0 &&
      Number.isFinite(resizedElement.x) &&
      Number.isFinite(resizedElement.y)
    ) {
      whiteboard.mutateElement(element, resizedElement, false);
    }

    if (group) {
      group.clearBounds();
    }
  };

  const onPointerUp = () => {
    whiteboard.notifyElementMutation(true);
  };

  whiteboard.handleDragEvent(onPointerMove, onPointerUp);
}
