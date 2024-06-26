import { ElementGroup } from "@/helpers/group";
import type { ElementTransformCallback, StaticWhiteboard } from "..";

export function dragElements(
  whiteboard: StaticWhiteboard,
  intialEvent: PointerEvent,
  group: ElementGroup,
  callback?: ElementTransformCallback
): void {
  const { zoom } = whiteboard.getViewport();

  let previousX = intialEvent.clientX;
  let previousY = intialEvent.clientY;

  let moved = true;

  const onPointerMove = (event: PointerEvent): void => {
    const { clientX, clientY } = event;

    const deltaX = (clientX - previousX) / zoom;
    const deltaY = (clientY - previousY) / zoom;

    previousX = clientX;
    previousY = clientY;

    whiteboard.mutateElements(
      group.elements,
      element => {
        const newX = element.x + deltaX;
        const newY = element.y + deltaY;
        return { x: newX, y: newY };
      },
      false
    );

    moved = true;
    group.clearBounds();
  };

  const onPointerUp = (): void => {
    if (moved) {
      whiteboard.notifyElementMutation(true);
    }

    if (callback) {
      callback(moved);
    }
  };

  whiteboard.handleDragEvent(onPointerMove, onPointerUp);
}
