import { RoughGenerator } from "roughjs/bin/generator";

import { DoodleElement } from "@/elements/types";
import { Shape } from "@/scene/types";
import { generateShapePath } from "@/scene/shape";

export class ShapeCache {
  private static cache = new WeakMap<DoodleElement, Shape>();

  private static get<T extends DoodleElement>(element: T): Shape | undefined {
    return ShapeCache.cache.get(element);
  }

  private static set<T extends DoodleElement>(element: T, shape: Shape): void {
    ShapeCache.cache.set(element, shape);
  }

  public static delete(element: DoodleElement): void {
    ShapeCache.cache.delete(element);
  }

  public static clear() {
    ShapeCache.cache = new WeakMap();
  }

  public static getShape<T extends DoodleElement>(
    element: T,
    generator: RoughGenerator,
    options?: {
      isExporting: boolean;
    }
  ): Shape | null {
    if (options === undefined || options.isExporting) {
      const cachedShape = ShapeCache.get(element);

      if (cachedShape !== undefined) {
        return cachedShape;
      }
    }

    const shape = generateShapePath(element, generator);

    if (shape !== null) {
      ShapeCache.set(element, shape);
    }

    return shape;
  }
}
