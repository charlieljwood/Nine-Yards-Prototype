import { calculateBounds } from "@/elements/intersection";
import { Bounds, DoodleElement, ElementGroupEvents } from "..";
import { Observable } from "./observable";

/**
 * Element selection group
 *
 * @fires selection:updated
 */
export class ElementGroup extends Observable<ElementGroupEvents> {
  private _elements: DoodleElement[];
  private _bounds: Bounds | null;

  public constructor(elements: DoodleElement[] = []) {
    super();

    this._elements = elements;
    this._bounds = null;
  }

  get elements(): readonly DoodleElement[] {
    return this._elements;
  }

  set elements(elements: DoodleElement[]) {
    this._elements = elements;
    this._bounds = null;

    this.fire("updated", { selected: this._elements });
  }

  get count(): number {
    return this._elements.length;
  }

  get bounds(): Bounds | null {
    // We want to keep these bound calculations lazy
    // to prevent unused calculations
    if (!this._bounds) {
      this._bounds = calculateBounds(this._elements);
    }

    return this._bounds;
  }

  public push(...elements: DoodleElement[]): void {
    this._elements.push(...elements);
    // We could calculate immediately but there's a
    // good change we'd never use the result so we
    // might as well wait until we actually need it
    // to do the work
    this._bounds = null;

    this.fire("updated", { selected: this._elements });
  }

  public remove(...elements: DoodleElement[]): void {
    this._elements = this._elements.filter(test => elements.includes(test));
    this._bounds = null;

    this.fire("updated", { selected: this._elements });
  }

  public clear(): void {
    this._elements = [];
    this._bounds = null;

    this.fire("updated", { selected: this._elements });
  }

  public setRotation(angle: number): void {
    const bounds = this.bounds;

    if (!bounds) {
      return;
    }

    bounds.rotation = angle;
  }

  public clearBounds(): void {
    this._bounds = null;
  }

  public includes(element: DoodleElement): boolean {
    return this._elements.includes(element);
  }
}
