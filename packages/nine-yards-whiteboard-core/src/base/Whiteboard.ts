import { nanoid } from "nanoid";

import type { Point } from "roughjs/bin/geometry";

import { fillCircle } from "@/renderer/helpers";
import { rotateElements } from "@/elements/rotate";
import { cursorTypeForHandle, testTransformHandles } from "@/elements/bounds";
import { resizeElements } from "@/elements/resize";
import {
  calculateBounds,
  testBoundingBox,
  testElement,
} from "@/elements/intersection";
import { ElementGroup } from "@/helpers/group";
import { Stack } from "@/helpers/stack";
import { StaticWhiteboard } from "@/base/StaticWhiteboard";
import { KeybindMap, KeyboardHandler, Shortcut } from "@/helpers/shortcut";
import {
  DEFAULT_WHITEBOARD_SETTINGS,
  MAX_ZOOM,
  MIN_ZOOM,
  ROTATION_OFFSET,
  TRANSFORM_POINT_RADIUS,
  ZOOM_STEP,
} from "@/base/constants";
import { CURSOR_TYPE, KEY, POINTER_TYPE, TOOL_TYPE } from "@/constants";
import { TRANSFORM_HANDLE } from "..";

import type { ToolType } from "@/types";
import type {
  WhiteboardEvents,
  WhiteboardSettings,
  WhiteboardStateSnapshot,
} from "@/base/types";
import type {
  DoodleElement,
  DoodleElementOptions,
  TransformHandleType,
} from "@/elements/types";
import { dragElements } from "@/elements/drag";
import { drawElement } from "@/elements/draw";
import { Mutable } from "@/helpers/types";

export class Whiteboard<
  EventSpec extends WhiteboardEvents = WhiteboardEvents,
> extends StaticWhiteboard<EventSpec> {
  private _selectedTool: ToolType;
  private _selectedElements: ElementGroup = new ElementGroup();
  private _selectionRegion: { start: Point; end: Point } | null;

  private mutationStack: Stack<WhiteboardStateSnapshot>;
  private undoneMutationStack: Stack<WhiteboardStateSnapshot>;
  private clipboard: readonly DoodleElement[];
  private _baseProperties: DoodleElementOptions;

  private canvasCursorX = 0;
  private canvasCursorY = 0;

  private keys: KeybindMap = new KeybindMap();

  private constructor(canvas: HTMLCanvasElement, options: WhiteboardSettings) {
    super(canvas, options);

    this._selectionRegion = null;

    this.mutationStack = new Stack();
    this.undoneMutationStack = new Stack();
    this.clipboard = [];
    this._baseProperties = {};

    this._selectedTool = options?.selectedTool ?? TOOL_TYPE.select;

    this.registerInbuiltActions();

    this.canvas.addEventListener("wheel", this.handleScroll);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handleCursorMove);

    document.addEventListener("keydown", this.handleKeydown);

    this.mutationStack.push(this.captureStateSnapshot());
  }

  public override cleanup(): void {
    super.cleanup();

    this.canvas.removeEventListener("wheel", this.handleScroll);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handleCursorMove);
    document.removeEventListener("keydown", this.handleKeydown);

    return;
  }

  public static on(
    canvas: HTMLCanvasElement,
    options?: Partial<WhiteboardSettings>
  ): Whiteboard {
    const settings = { ...DEFAULT_WHITEBOARD_SETTINGS, ...options };
    return new Whiteboard(canvas, settings);
  }

  public static initialize(
    options?: Partial<WhiteboardSettings & { parent?: HTMLElement }>
  ): Whiteboard {
    const parent = options?.parent ?? document.body;
    const canvas = document.createElement("canvas");

    parent.appendChild(canvas);
    const settings = { ...DEFAULT_WHITEBOARD_SETTINGS, ...options };

    return new Whiteboard(canvas, settings);
  }

  public getSelectedTool(): ToolType {
    return this._selectedTool;
  }

  public setSelectedTool(selectedTool: ToolType): void {
    this._selectedTool = selectedTool;
    this._selectedElements.clear();

    this.fire("tool:selected", { type: this._selectedTool });
  }

  public getSelection(): ElementGroup {
    return this._selectedElements;
  }

  public getSelectedElements(): readonly DoodleElement[] {
    return this._selectedElements.elements;
  }

  public getBaseProperties(): DoodleElementOptions {
    return this._baseProperties;
  }

  public updateBaseProperties(updates: DoodleElementOptions): void {
    Object.assign(this._baseProperties, updates);
  }

  public setSelectedElements(elements: DoodleElement[]): void {
    this._selectedElements.elements = elements;
    this.requestFrame(true);
  }

  public deselectElement(...elements: DoodleElement[]): void {
    this._selectedElements.remove(...elements);
    this.requestFrame(true);
  }

  public clearSelectedElements(): void {
    this._selectedElements.clear();
    this.requestFrame(true);
  }

  public registerShortcut(shortcut: Shortcut, action: KeyboardHandler): void {
    this.keys.register(shortcut, action);
  }

  public override notifyElementMutation(force?: boolean): void {
    if (force) {
      this.mutationStack.push(this.captureStateSnapshot());
      this.undoneMutationStack.clear();
    }

    super.notifyElementMutation();
  }

  protected override _mutateElement<T extends Mutable<DoodleElement>>(
    element: T,
    updates: Omit<Partial<T>, "version" | "versionNonce" | "updated" | "type">,
    version: boolean
  ): T {
    Object.assign(this._baseProperties, updates);
    return super._mutateElement(element, updates, version);
  }

  public mutateSelectedElements(
    updater: <T extends DoodleElement>(
      element: T
    ) => Omit<
      Partial<DoodleElement>,
      "type" | "version" | "versionNonce" | "updated"
    >,
    version = true
  ): void {
    const elements = this._selectedElements.elements;
    this.mutateElements(elements, updater, version);
  }

  private registerInbuiltActions(): void {
    this.keys.register({ key: KEY.Z, ctrlKey: true }, this.undoAction);
    this.keys.register({ key: KEY.R, ctrlKey: true }, this.redoAction);
    this.keys.register({ key: KEY.DELETE }, this.deleteSelection);
    this.keys.register({ key: KEY.BACKSPACE }, this.deleteSelection);
    this.keys.register({ key: KEY.D }, this.deleteSelection);
    this.keys.register({ key: KEY.C, ctrlKey: true }, this.saveClipboard);
    this.keys.register({ key: KEY.V, ctrlKey: true }, this.pasteClipboard);

    this.keys.register(
      { key: KEY.SQUARE_BRACKET_LEFT },
      this.moveSelectionToFront
    );

    this.keys.register(
      { key: KEY.SQUARE_BRACKET_RIGHT },
      this.moveSelectionToBack
    );

    this.keys.register({ key: KEY.P }, () =>
      this.setSelectedTool(TOOL_TYPE.pan)
    );
    this.keys.register({ key: KEY.S }, () =>
      this.setSelectedTool(TOOL_TYPE.select)
    );
    this.keys.register({ key: KEY.R }, () =>
      this.setSelectedTool(TOOL_TYPE.rectangle)
    );
    this.keys.register({ key: KEY.E }, () =>
      this.setSelectedTool(TOOL_TYPE.ellipse)
    );
    this.keys.register({ key: KEY.T }, () =>
      this.setSelectedTool(TOOL_TYPE.triangle)
    );
  }

  public deleteSelection = () => {
    this.removeElements(this._selectedElements.elements);
    this._selectedElements.clear();

    this.notifyElementMutation(true);
  };

  protected override _render(): void {
    super._render();

    this.renderTransformHandles();
    this.renderSelectionRegion();
  }

  private renderTransformHandles(): void {
    if (!this._selectedElements) {
      return;
    }

    const selectedElements = this._selectedElements.elements;

    if (selectedElements.length === 0) {
      return;
    }

    const bounds = this._selectedElements.bounds;

    if (bounds === null) {
      return;
    }

    const { scrollX, scrollY } = this.getViewport();

    selectedElements.forEach(element => {
      this.context.save();

      const x1 = element.x;
      const x2 = element.x + element.width;
      const y1 = element.y;
      const y2 = element.y + element.height;

      const cx = (x1 + x2) / 2 + scrollX;
      const cy = (y1 + y2) / 2 + scrollY;
      const shiftX = (x2 - x1) / 2 - (element.x - x1);
      const shiftY = (y2 - y1) / 2 - (element.y - y1);

      this.context.translate(cx, cy);
      this.context.rotate(element.rotation);

      this.context.translate(-shiftX, -shiftY);

      this.context.strokeStyle = "#d2a8ff";
      this.context.strokeRect(0, 0, element.width, element.height);

      this.context.restore();
    });

    this.context.save();

    const x1 = bounds.x;
    const x2 = bounds.x + bounds.width;
    const y1 = bounds.y;
    const y2 = bounds.y + bounds.height;

    const cx = (x1 + x2) / 2 + scrollX;
    const cy = (y1 + y2) / 2 + scrollY;
    const shiftX = (x2 - x1) / 2 - (bounds.x - x1);
    const shiftY = (y2 - y1) / 2 - (bounds.y - y1);

    this.context.translate(cx, cy);

    this.context.rotate(bounds.rotation);

    this.context.translate(-shiftX, -shiftY);
    this.context.strokeStyle = "#d2a8ff";

    const { width, height } = bounds;

    this.context.strokeRect(0, 0, width, height);

    fillCircle(this.context, 0, 0, TRANSFORM_POINT_RADIUS);
    fillCircle(this.context, width, 0, TRANSFORM_POINT_RADIUS);
    fillCircle(this.context, 0, height, TRANSFORM_POINT_RADIUS);
    fillCircle(this.context, width, height, TRANSFORM_POINT_RADIUS);

    fillCircle(
      this.context,
      width / 2,
      -ROTATION_OFFSET,
      TRANSFORM_POINT_RADIUS
    );

    this.context.restore();
  }

  private renderSelectionRegion(): void {
    if (!this._selectionRegion) {
      return;
    }

    this.context.save();

    const { start, end } = this._selectionRegion;

    const width = end[0] - start[0];
    const height = end[1] - start[1];

    const { scrollX, scrollY } = this.getViewport();

    this.context.fillStyle = "#d2a8ffaa";
    this.context.strokeStyle = "#d2a8ff";
    this.context.fillRect(
      start[0] + scrollX,
      start[1] + scrollY,
      width,
      height
    );

    this.context.restore();
  }

  public saveClipboard = (): void => {
    const elements = this._selectedElements.elements;
    this.clipboard = elements;
  };

  public pasteClipboard = (): void => {
    if (this.clipboard.length === 0) {
      return;
    }

    const clipboardBounds = calculateBounds(this.clipboard);

    if (!clipboardBounds) {
      return;
    }

    const cx = clipboardBounds.x + clipboardBounds.width / 2;
    const cy = clipboardBounds.y + clipboardBounds.height / 2;

    const tx = this.canvasCursorX - cx;
    const ty = this.canvasCursorY - cy;

    const transformedClipboard = this.clipboard.map(element => {
      const id = nanoid();

      const newX = element.x + tx;
      const newY = element.y + ty;

      return { ...element, id, x: newX, y: newY };
    });

    this._selectedElements.elements = transformedClipboard;
    this.addElements(transformedClipboard);
  };

  public undoAction = (): void => {
    if (this.mutationStack.length <= 1) {
      return;
    }

    this._selectedElements.clear();
    const undoneState = this.mutationStack.pop();

    if (!undoneState) {
      return;
    }

    this.undoneMutationStack.push(undoneState);

    const stackFrame = this.mutationStack.pop();

    if (!stackFrame) {
      return;
    }

    this.setElements(stackFrame.elements);
  };

  public redoAction = () => {
    if (this.undoneMutationStack.length === 0) {
      return;
    }

    const redoneState = this.undoneMutationStack.pop();

    if (!redoneState) {
      return;
    }

    this.mutationStack.push(redoneState);

    const stackFrame = this.undoneMutationStack.pop();
    this._selectedElements.clear();

    if (!stackFrame) {
      return;
    }

    this.mutationStack.push(this.captureStateSnapshot());
    this.setElements(stackFrame.elements);
  };

  public moveSelectionToFront = () => {
    const selection = this._selectedElements.elements;

    const filteredElements = this._elements.filter(
      element => !selection.includes(element)
    );

    const newElements = filteredElements.concat(selection);
    this.setElements(newElements);
  };

  public moveSelectionToBack = () => {
    const selection = this._selectedElements.elements;

    const filteredElements = this._elements.filter(
      element => !selection.includes(element)
    );

    const newElements = selection.concat(filteredElements);
    this.setElements(newElements);
  };

  private handleScroll = (event: WheelEvent): void => {
    if (event.deltaX === 0 && event.deltaY === 0) {
      // Prevent any re-renders when the application state
      // has not actually changed.
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      this.handleZoomScroll(event);
      return;
    }

    if (event.shiftKey) {
      this.handleHorizontalScroll(event);
      return;
    }

    this.updateViewport(viewportState => {
      const { scrollX, scrollY, zoom } = viewportState;

      const newScrollX = scrollX - event.deltaX / zoom;
      const newScrollY = scrollY - event.deltaY / zoom;

      return { ...viewportState, scrollX: newScrollX, scrollY: newScrollY };
    });
  };

  private handleZoomScroll(event: WheelEvent): void {
    // Prevent the browser from zooming in the whole page
    // make sure this event is only registered on the
    // canvas to prevent blocking this functionality in
    // other parts of the page
    event.preventDefault();

    const MAX_STEP = ZOOM_STEP * 100;
    let delta = event.deltaY;

    const scalar = Math.abs(delta);
    const sign = Math.sign(delta);

    this.updateViewport(viewportState => {
      const currentZoom = Math.max(viewportState.zoom, 1);

      if (scalar > MAX_STEP) {
        delta = MAX_STEP * sign;
      }

      // Should have no effect on scroll wheel inputs but
      // reduce the movement of smaller trackpad inputs
      // to better allow for finer panning control with
      // a trackpad
      const amplification = Math.min(1, scalar / 20);

      let newZoom = viewportState.zoom - delta / 100;
      newZoom += Math.log10(currentZoom) * -sign * amplification;

      newZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));

      return { ...viewportState, zoom: newZoom };
    });
  }

  private handleHorizontalScroll(event: WheelEvent): void {
    const delta = event.deltaY || event.deltaX;

    this.updateViewport(viewportState => {
      const newScrollX = viewportState.scrollX - delta / viewportState.zoom;

      return { ...viewportState, scrollX: newScrollX };
    });
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (
      event.button === POINTER_TYPE.WHEEL ||
      (event.button === POINTER_TYPE.MAIN &&
        this._selectedTool === TOOL_TYPE.pan)
    ) {
      this.handleDragPanning(event);
      return;
    }

    if (
      event.button === POINTER_TYPE.MAIN &&
      (this._selectedTool === TOOL_TYPE.ellipse ||
        this._selectedTool === TOOL_TYPE.triangle ||
        this._selectedTool === TOOL_TYPE.rectangle)
    ) {
      drawElement(this, event, this._selectedTool);
    }

    if (this.handleElementSelection(event)) {
      return;
    }

    if (this.tryHandleElementUpdate(event)) {
      return;
    }

    if (
      event.button === POINTER_TYPE.MAIN &&
      this._selectedTool === TOOL_TYPE.select
    ) {
      this.handleDragSelection(event);
    }
  };

  private handleDragPanning(event: PointerEvent): void {
    let lastX = event.clientX;
    let lastY = event.clientY;

    const onPointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;

      lastX = event.clientX;
      lastY = event.clientY;

      this.updateViewport(viewportState => {
        const { scrollX, scrollY, zoom } = viewportState;

        const newScrollX = scrollX + deltaX / zoom;
        const newScrollY = scrollY + deltaY / zoom;

        return { ...viewportState, scrollX: newScrollX, scrollY: newScrollY };
      });
    };

    const onPointerUp = () => {
      this.canvas.style.cursor = "default";

      // Ensure the final state set by the user is always
      // displayed and stored to prevent inconsistencies
      // when reloading or other visual artifacts when moving
      // the viewport in the future
      this.notifyViewportChange(true);
    };

    this.handleDragEvent(onPointerMove, onPointerUp);
  }

  private handleElementSelection(event: PointerEvent): boolean {
    const { scrollX, scrollY, zoom } = this.getViewport();

    const x = event.clientX / zoom - scrollX;
    const y = event.clientY / zoom - scrollY;

    const initialIntersection = this.getElements().filter(element =>
      testElement([x, y], element)
    );

    if (initialIntersection.length === 0) {
      return false;
    }

    const index = initialIntersection.length - 1;
    const intersection = initialIntersection[index];

    const alreadySelected = this._selectedElements.includes(intersection);

    // While holding shift we allow for multi-selection,
    // if an already selected element is clicked when
    // the shift key is held it should be deselected so
    // that the selection does not need to be restarted
    // upon a missed target
    if (alreadySelected && event.shiftKey) {
      this.handleDeselecitonOrDrag(intersection, event);
      return true;
    } else if (event.shiftKey) {
      this._selectedElements.push(intersection);
    } else {
      this._selectedElements.elements = [intersection];
    }

    this._selectedElements.clearBounds();
    dragElements(this, event, this._selectedElements);

    // Force a frame here to enforce the selection being
    // displayed and other artifacts
    this.requestFrame(true);

    return true;
  }

  private handleDeselecitonOrDrag(
    interseciton: DoodleElement,
    event: PointerEvent
  ): void {
    const callback = (moved: boolean) => {
      if (moved) {
        return;
      }

      this.deselectElement(interseciton);
    };

    dragElements(this, event, this._selectedElements, callback);
  }

  private handleDragSelection(event: PointerEvent): void {
    const { scrollX, scrollY, zoom } = this.getViewport();

    const x = event.clientX / zoom - scrollX;
    const y = event.clientY / zoom - scrollY;

    // This is techinically redundant as without the shift
    // key being held the selection will be overwritten
    // anyway but it provides visual indication that the
    // selection will be replaced by the new one to the user
    // before they release
    if (!event.shiftKey) {
      this._selectedElements.clear();
    }

    const originalSelection = this._selectedElements;
    this._selectionRegion = { start: [x, y], end: [x, y] };

    const onPointerMove = (event: PointerEvent): void => {
      if (this._selectionRegion === null) {
        return;
      }

      const { clientX, clientY } = event;

      const x = clientX / zoom - scrollX;
      const y = clientY / zoom - scrollY;

      this._selectionRegion.end = [x, y];

      const { start, end } = this._selectionRegion;

      // Ensure that we have actual maximum and minimum
      // values for our bounding region
      const rx1 = Math.min(start[0], end[0]);
      const ry1 = Math.min(start[1], end[1]);

      const rx2 = Math.max(start[0], end[0]);
      const ry2 = Math.max(start[1], end[1]);

      const elements = this.getElements();

      // As we completley overwrite the selection we dont
      // need to do a check for previously selected elements
      const intersection = elements.filter(element => {
        const x1 = element.x;
        const x2 = element.x + element.width;
        const y1 = element.y;
        const y2 = element.y + element.height;

        const xValid = x1 > rx1 && x2 < rx2;
        const yValid = y1 > ry1 && y2 < ry2;

        return xValid && yValid;
      });

      // When holding shift elements should be appeneded
      // to the existing selection instead of replaced
      if (event.shiftKey) {
        intersection.push(...originalSelection.elements);
      }

      this._selectedElements.elements = intersection;
      this.requestFrame();
    };

    const onPointerUp = (): void => {
      this._selectionRegion = null;
      this.requestFrame(true);
    };

    this.handleDragEvent(onPointerMove, onPointerUp);
  }

  private tryHandleElementUpdate(event: PointerEvent): boolean {
    const selectedElements = this._selectedElements.elements;

    if (selectedElements.length === 0) {
      return false;
    }

    const bounds = calculateBounds(selectedElements);

    if (bounds === null) {
      return false;
    }

    const { zoom, scrollX, scrollY } = this.getViewport();

    const initialX = event.clientX;
    const initialY = event.clientY;

    const x = initialX / zoom - scrollX;
    const y = initialY / zoom - scrollY;

    const point: Point = [x, y];

    const handle = testTransformHandles(point, bounds);

    if (handle) {
      this.handleTransformHandle(handle);
      return true;
    }

    if (testBoundingBox(point, bounds)) {
      dragElements(this, event, this._selectedElements);
      return true;
    }

    return false;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  private handleTransformHandle(handle: TransformHandleType): void {
    if (handle === TRANSFORM_HANDLE.ROTATION) {
      this.handleSelectionRotation();
      return;
    }

    resizeElements(this, handle, this._selectedElements);
  }

  private handleSelectionRotation(): void {
    rotateElements(this, this._selectedElements);
    return;
  }

  private handleKeydown = (event: KeyboardEvent) => {
    const handler = this.keys.getHandler(event);

    if (!handler) {
      return;
    }

    event.preventDefault();
    handler(event);
  };

  private handleCursorMove = (event: PointerEvent) => {
    const { zoom, scrollX, scrollY } = this.getViewport();
    const { clientX, clientY } = event;

    this.canvasCursorX = clientX / zoom - scrollX;
    this.canvasCursorY = clientY / zoom - scrollY;

    this.styleCursor();
  };

  private styleCursor(): void {
    if (this.dragging) {
      return;
    }

    const bounds = this._selectedElements.bounds;

    if (!bounds) {
      return;
    }

    const pointer: Point = [this.canvasCursorX, this.canvasCursorY];
    const handle = testTransformHandles(pointer, bounds);

    const cursor = handle
      ? cursorTypeForHandle(handle, bounds.rotation)
      : CURSOR_TYPE.AUTO;

    document.body.style.cursor = cursor;
  }

  private captureStateSnapshot(): WhiteboardStateSnapshot {
    return { elements: structuredClone(this._elements) };
  }
}
