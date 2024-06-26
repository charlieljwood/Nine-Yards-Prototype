import rough from "roughjs";

import type { RoughCanvas } from "roughjs/bin/canvas";

import { randomInteger } from "@/helpers/random";
import { ShapeCache } from "@/scene/cache";
import { DEFAULT_STATIC_WHITEBOARD_SETTINGS } from "@/base/constants";

import type { Mutable } from "@/helpers/types";

import type {
  ResizeTarget,
  StaticWhiteboardEvents,
  StaticWhiteboardSettings,
  ViewportState,
  WhiteboardSettings,
} from "@/base/types";
import type { DoodleElement } from "@/elements/types";
import { Observable } from "@/helpers/observable";

/**
 * Static whiteboard class
 *
 * @fires render:before
 * @fires render:after
 */
export class StaticWhiteboard<
  EventSpec extends StaticWhiteboardEvents = StaticWhiteboardEvents,
> extends Observable<EventSpec> {
  protected canvas: HTMLCanvasElement;
  protected context: CanvasRenderingContext2D;
  protected roughCanvas: RoughCanvas;

  private previousRender = 0;

  protected _elements: DoodleElement[];
  private _background: string;
  private _resizeTarget: ResizeTarget | undefined;
  private _viewportState: ViewportState;

  protected dragging = false;

  protected constructor(
    canvas: HTMLCanvasElement,
    settings: StaticWhiteboardSettings
  ) {
    super();

    this.canvas = canvas;
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("Failed to setup canvas for whiteboard");
    }

    this.context = context;
    this.roughCanvas = rough.canvas(canvas);

    this._elements = settings.elements;
    this._background = settings.background;
    this._resizeTarget = settings.resizeTo;

    this._viewportState = settings.viewport;

    this.setupCanvas(settings);
  }

  /**
   * Initialize a new static whiteboard on a given existing canvas element
   *
   * @param {HTMLCanvasElement} canvas - The canvas to create the whiteboard on
   * @param {Partial<StaticWhiteboardSettings>} [options] - configuration settings for the whiteboard
   *
   * @returns {StaticWhiteboard} - The whiteboard instance created
   *
   * @example
   * // Create a new canvas element
   * const canvas = document.getElementById('myCanvas');
   *
   * // Create a new canvas with a white background
   * const whiteboard = StaticWhiteboard.on(canvas, { background: '#ffffff' });
   */
  public static on(
    canvas: HTMLCanvasElement,
    options?: Partial<StaticWhiteboardSettings>
  ): StaticWhiteboard {
    const settings = { ...DEFAULT_STATIC_WHITEBOARD_SETTINGS, ...options };
    return new StaticWhiteboard(canvas, settings);
  }

  /**
   * Initialize a new static whiteboard and create a canvas for it on a specifed parent element,
   * if a parent element isn't specifed it will be created at the root of the document body
   *
   * @param {Partial<StaticWhiteboardSettings & { parent?: HTMLElement }>} [options] - configuration
   * options for the static whiteboard
   *
   * @returns {StaticWhiteboard} - The whiteboard instance created.
   *
   * @example
   * Create a new canvas and whiteboard instance at the root of the body
   * const myWhiteboard = StaticWhiteboard.initialize();
   *
   * Create a new canvas and whiteboard instance within a specified element
   * const container = document.getElementById('myElement');
   * const myOtherWhiteboard = StaticWhiteboard.initialize({ parent: container });
   */
  public static initialize(
    options?: Partial<StaticWhiteboardSettings & { parent?: HTMLElement }>
  ): StaticWhiteboard {
    const parent = options?.parent ?? document.body;
    const canvas = document.createElement("canvas");

    parent.appendChild(canvas);
    const settings = { ...DEFAULT_STATIC_WHITEBOARD_SETTINGS, ...options };

    return new StaticWhiteboard(canvas, settings);
  }

  public notifyViewportChange(force = false): void {
    this.requestFrame(force);

    if (force) {
      this.fire("viewport:mutation", { state: this._viewportState });
    }
  }

  public notifyElementMutation(force = true): void {
    this.requestFrame(force);

    if (force) {
      this.fire("element:mutation", { state: this._elements });
    }
  }

  private setupCanvas(settings: WhiteboardSettings): void {
    if (this._resizeTarget) {
      this.onResizeEvent();
      this._resizeTarget.addEventListener("resize", this.onResizeEvent);
    } else {
      this.resize(settings.width, settings.height);
    }
  }

  /**
   * @virtual
   */
  public cleanup(): void {
    if (this._resizeTarget) {
      this._resizeTarget.removeEventListener("resize", this.onResizeEvent);
    }
  }

  public setViewport(
    state: Partial<ViewportState>,
    forceRerender = false
  ): void {
    this._viewportState = { ...this._viewportState, ...state };

    this.notifyViewportChange(forceRerender);
  }

  public updateViewport(
    updater: (state: ViewportState) => ViewportState,
    forceRerender = false
  ): void {
    const updated = updater(this._viewportState);

    this._viewportState = updated;
    this.notifyViewportChange(forceRerender);
  }

  public getViewport(): ViewportState {
    return this._viewportState;
  }

  public getElements(): DoodleElement[] {
    return this._elements;
  }

  public setElements(elements: DoodleElement[]): void {
    this._elements = elements;
    this.notifyElementMutation();
  }

  public getBackground(): string {
    return this._background;
  }

  public setBackground(background: string): void {
    this._background = background;
    this.requestFrame(true);
  }

  public setResizeTarget(resizeTarget: ResizeTarget | undefined): void {
    this._resizeTarget = resizeTarget;

    if (resizeTarget) {
      this.onResizeEvent();
    }
  }

  public clearResizeTarget(): void {
    this._resizeTarget = undefined;
  }

  public requestFrame(force = false): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.previousRender;

    if (!force && deltaTime < 15) {
      return;
    }

    // Even if we are forcing a frame we still want to
    // track when we did an update so we can try and
    // continue to revert back to around ~60fps maximum
    this.previousRender = currentTime;
    this._render();
  }

  protected _render(): void {
    this.context.reset();

    this.context.fillStyle = this._background;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.scale(this._viewportState.zoom, this._viewportState.zoom);

    this.fire("render:before", { ctx: this.context });

    for (let i = 0; i < this._elements.length; i++) {
      const element = this._elements[i];
      this.renderElement(element);
    }

    this.fire("render:after", { ctx: this.context });
  }

  private renderElement(element: DoodleElement): void {
    const drawable = ShapeCache.getShape(element, this.roughCanvas.generator);

    if (!drawable) {
      return;
    }

    this.context.save();

    const x1 = element.x;
    const x2 = element.x + element.width;
    const y1 = element.y;
    const y2 = element.y + element.height;

    const cx = (x1 + x2) / 2 + this._viewportState.scrollX;
    const cy = (y1 + y2) / 2 + this._viewportState.scrollY;
    const shiftX = (x2 - x1) / 2 - (element.x - x1);
    const shiftY = (y2 - y1) / 2 - (element.y - y1);

    this.context.translate(cx, cy);
    this.context.rotate(element.rotation);

    this.context.translate(-shiftX, -shiftY);

    if (Array.isArray(drawable)) {
      drawable.forEach(shape => this.roughCanvas.draw(shape));
    } else {
      this.roughCanvas.draw(drawable);
    }

    this.context.restore();
  }

  public addElement(element: DoodleElement): void {
    this._elements.push(element);
    this.requestFrame(true);
  }

  public addElements(elements: DoodleElement[]): void {
    this._elements.push(...elements);
    this.requestFrame(true);
  }

  protected _mutateElement<T extends Mutable<DoodleElement>>(
    element: T,
    updates: Omit<Partial<T>, "type" | "version" | "versionNonce" | "updated">,
    version: boolean
  ): T {
    Object.assign(element, updates);

    if (version) {
      element.version++;
      element.versionNonce = randomInteger();
      element.updated = Date.now();
    }

    ShapeCache.delete(element);
    return element;
  }

  public mutateElement<T extends Mutable<DoodleElement>>(
    element: T,
    updates: Omit<Partial<T>, "type" | "version" | "versionNonce" | "updated">,
    version = true
  ): T {
    const mutated = this._mutateElement(element, updates, version);
    this.notifyElementMutation(version);

    return mutated;
  }

  public mutateElements(
    elements: readonly DoodleElement[],
    updater: (
      element: DoodleElement
    ) => Omit<
      Partial<DoodleElement>,
      "type" | "version" | "versionNonce" | "updated"
    >,
    version = true
  ): void {
    elements.forEach(element =>
      this._mutateElement(element, updater(element), version)
    );

    this.notifyElementMutation(version);
  }

  public removeElements(elements: readonly DoodleElement[]): void {
    this._elements = this._elements.filter(el => !elements.includes(el));
    this.notifyElementMutation();
  }

  public removeElement(element: DoodleElement): void {
    this.removeElements([element]);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    this.requestFrame(true);
  }

  public handleDragEvent(
    movementCallback: (event: PointerEvent) => void,
    finishCallback?: () => void
  ): void {
    this.dragging = true;

    const onPointerUp = (): void => {
      if (finishCallback) {
        finishCallback();
      }

      this.dragging = false;

      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", onPointerUp);

      window.removeEventListener("pointermove", movementCallback);
    };

    window.addEventListener("pointermove", movementCallback);

    window.addEventListener("blur", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);
  }

  private onResizeEvent = (): void => {
    if (!this._resizeTarget) {
      return;
    }

    let newWidth, newHeight;

    if (this._resizeTarget === window) {
      newHeight = window.innerHeight;
      newWidth = window.innerWidth;
    } else {
      const { clientWidth, clientHeight } = this._resizeTarget as HTMLElement;

      newHeight = clientHeight;
      newWidth = clientWidth;
    }

    this.resize(newWidth, newHeight);
  };
}
