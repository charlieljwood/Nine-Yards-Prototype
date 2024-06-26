import { type DoodleElement, type Whiteboard, TRANSFORM_HANDLE } from "..";
import { resizeSingleElement } from "./resize";
import { setupElement } from "./setup";

export function drawElement(
  whiteboard: Whiteboard,
  initialEvent: PointerEvent,
  type: DoodleElement["type"]
): void {
  const { scrollX, scrollY, zoom } = whiteboard.getViewport();

  const initialX = initialEvent.clientX / zoom - scrollX;
  const initialY = initialEvent.clientY / zoom - scrollY;

  const base = whiteboard.getBaseProperties();

  const element = setupElement(type, {
    ...base,
    x: initialX,
    y: initialY,
  });

  if (!element) {
    return;
  }

  whiteboard.addElement(element);
  whiteboard.setSelectedElements([element]);

  resizeSingleElement(
    whiteboard,
    TRANSFORM_HANDLE.SOUTH_EAST,
    element,
    whiteboard.getSelection()
  );
}
