import { DoodleElement } from "@/elements/types";
import { randomInteger } from "@/helpers/random";
import { nanoid } from "nanoid";
import { DEFAULT_ELEMENT_OPTIONS } from "./constants";

export function setupElement<T extends DoodleElement>(
  type: T["type"],
  options: Omit<
    Partial<T>,
    "id" | "type" | "version" | "versionNonce" | "updated"
  >
): T | null {
  const element_id = nanoid();
  const seed = randomInteger();
  const updated = Date.now();

  const base: Omit<DoodleElement, "type"> = {
    ...DEFAULT_ELEMENT_OPTIONS,
    ...options,
    id: element_id,
    seed,
    updated,
    width: 3,
    height: 3,
    rotation: 0,
    version: 1,
    versionNonce: 1,
  };

  switch (type) {
    case "rectangle":
    case "ellipse":
      return { ...base, type } as T;

    case "triangle":
      return { shift: 0.5, ...base, type } as T;
  }

  return null;
}
