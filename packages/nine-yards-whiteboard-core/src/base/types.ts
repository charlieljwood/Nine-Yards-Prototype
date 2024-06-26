import type { RoughCanvas } from "roughjs/bin/canvas";

import type { ToolType } from "@/types";
import type { DoodleElement } from "@/elements/types";

export type RenderLayer = (
  context: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas
) => void;

export type ElementMutationCallback = (state: readonly DoodleElement[]) => void;
export type ViewportChangeCallback = (state: ViewportState) => void;
export type ElementTransformCallback = (updated: boolean) => void;

export interface StaticWhiteboardEvents {
  "element:mutation": { state: readonly DoodleElement[] };
  "viewport:mutation": { state: ViewportState };

  "render:before": { ctx: CanvasRenderingContext2D };
  "render:after": { ctx: CanvasRenderingContext2D };
}

export interface WhiteboardEvents extends StaticWhiteboardEvents {
  "tool:selected": { type: ToolType };
}

export interface ElementGroupEvents {
  updated: { selected: readonly DoodleElement[] };
}

export type StaticWhiteboardSettings = {
  /**
   * A target container that the canvas should be resized to, this will track any
   * time the target is resized and continue to match it.
   */
  resizeTo?: ResizeTarget;
  /**
   * The width in pixels to resize the canvas to
   *
   * @remarks
   * If resizeTo field is set then this value will be overridden by the width
   * of the container specified.
   *
   * @default 100
   */
  width: number;
  /**
   * The height in pixels to resize the canvas to
   *
   * @remarks
   * If  the resizeTo field is set then this value will be overridden by the height
   * of the container specified.
   *
   * @default 100
   */
  height: number;
  /**
   * Which part of the whiteboard is currently being viewed
   *
   * @default { zoom: 2, scrollX: 0, scrollY: 0 }
   */
  viewport: ViewportState;
  /**
   * The initial elements on the whiteboard
   *
   * @default []
   */
  elements: DoodleElement[];
  /**
   * The background colour rendered by the whiteboard
   *
   * @example
   * const whiteboard = Whiteboard.initialize({
   *  background: "#ff0000"
   * })
   *
   * @example
   * const whiteboard = Whiteboard.initialize({
   *  background: "red"
   * })
   *
   * @default "#ffffff"
   */
  background: string;
};

export type WhiteboardSettings = StaticWhiteboardSettings & {
  /**
   * The tool being currently selected by the whiteboard
   *
   * @default "select"
   **/
  selectedTool?: ToolType;
};

export type ResizeTarget = HTMLElement | Window;

export interface WhiteboardState {
  /**
   * The horizontal offset off the viewport from the origin of the canvas
   * in the positive x direction.
   *
   * @default 0
   */
  scrollX: number;
  /**
   * The veritcal offset of the viewport from the origin of the canvas
   * in the positive y direction
   *
   * @default 0
   */
  scrollY: number;
  /**
   * The scaling of the viewport
   *
   * @default 2
   */
  zoom: number;
  /**
   * The state of all of the elements on the canvas in order of their
   * display
   *
   * @default []
   */
  elements: DoodleElement[];
  background: string;
}

export type ViewportState = {
  scrollX: WhiteboardState["scrollX"];
  scrollY: WhiteboardState["scrollY"];
  zoom: WhiteboardState["zoom"];
};

export type WhiteboardStateSnapshot = {
  elements: DoodleElement[];
};
