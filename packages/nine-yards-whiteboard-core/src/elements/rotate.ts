import { ElementGroup } from "@/helpers/group";
import { DoodleElement, StaticWhiteboard } from "..";
import { Point } from "roughjs/bin/geometry";
import { rotateAround } from "@/helpers/maths";

export function rotateElements(
  whiteboard: StaticWhiteboard,
  group: ElementGroup
): void {
  const { elements } = group;

  if (elements.length > 1) {
    rotateMultipleElements(whiteboard, group);
    return;
  }

  if (elements.length === 1) {
    const [element] = elements;
    rotateSingleElement(whiteboard, element, group);

    return;
  }
}

function rotateMultipleElements(
  whiteboard: StaticWhiteboard,
  group: ElementGroup
): void {
  const { elements, bounds } = group;

  if (!bounds) {
    return;
  }

  const { scrollX, scrollY, zoom } = whiteboard.getViewport();

  const originalElements = elements.reduce((map, element) => {
    map.set(element.id, structuredClone(element));
    return map;
  }, new Map());

  const originX = bounds.x + bounds.width / 2;
  const originY = bounds.y + bounds.height / 2;

  const origin: Point = [originX, originY];

  const onPointerMove = (event: PointerEvent): void => {
    const { clientX, clientY } = event;

    const pointerX = clientX / zoom - scrollX;
    const pointerY = clientY / zoom - scrollY;

    const offset = (5 * Math.PI) / 2;
    const gap = Math.atan2(pointerY - originY, pointerX - originX);

    const boundRotation = gap + offset;

    whiteboard.mutateElements(
      elements,
      element => {
        const elementOriginX = element.x + element.width / 2;
        const elementOriginY = element.y + element.height / 2;

        const elementOrigin: Point = [elementOriginX, elementOriginY];

        const original = originalElements.get(element.id);
        const originalAngle = original?.rotation ?? element.rotation;

        const rotationAngle = boundRotation + originalAngle - element.rotation;

        const [newX, newY] = rotateAround(elementOrigin, rotationAngle, origin);

        return {
          ...element,
          rotation: (boundRotation + originalAngle) % (2 * Math.PI),
          x: element.x + (newX - elementOriginX),
          y: element.y + (newY - elementOriginY),
        };
      },
      false
    );

    group.setRotation(boundRotation % (2 * Math.PI));
  };

  const onPointerUp = () => {
    whiteboard.notifyElementMutation(true);
  };

  whiteboard.handleDragEvent(onPointerMove, onPointerUp);
}

function rotateSingleElement(
  whiteboard: StaticWhiteboard,
  element: DoodleElement,
  group?: ElementGroup
): void {
  const { scrollX, scrollY, zoom } = whiteboard.getViewport();

  const originX = element.x + element.width / 2;
  const originY = element.y + element.height / 2;

  const onPointerMove = (event: PointerEvent): void => {
    const { clientX, clientY } = event;

    const pointerX = clientX / zoom - scrollX;
    const pointerY = clientY / zoom - scrollY;

    const offset = (5 * Math.PI) / 2;
    const gap = Math.atan2(pointerY - originY, pointerX - originX);

    const rotation = (gap + offset) % (Math.PI * 2);

    whiteboard.mutateElement(element, { rotation }, false);

    if (group) {
      group.clearBounds();
    }
  };

  const onPointerUp = () => {
    whiteboard.notifyElementMutation(true);
  };

  whiteboard.handleDragEvent(onPointerMove, onPointerUp);
}
