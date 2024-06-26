import { Key } from "@/types";

export class KeybindMap {
  private shortcuts = new Map<string, KeyboardHandler>();

  public register(shortcut: Shortcut, action: KeyboardHandler): void {
    const key = formatShortcut(shortcut);

    this.shortcuts.set(key, action);
  }

  public getHandler(
    shortcut: Shortcut | KeyboardEvent
  ): KeyboardHandler | undefined {
    const key = formatShortcut(shortcut);
    return this.shortcuts.get(key);
  }

  public clear(): void {
    this.shortcuts.clear();
  }

  public removeHandler(shortcut: Shortcut): void {
    const key = formatShortcut(shortcut);
    this.shortcuts.delete(key);
  }
}

function formatShortcut(shortcut: Shortcut | KeyboardEvent): string {
  const { key, ctrlKey, altKey, shiftKey } = shortcut;
  return `${ctrlKey ? "C-" : ""}${shiftKey ? "S-" : ""}${altKey ? "A-" : ""}${key}`;
}

export type Shortcut = {
  key: Key;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
};

export type KeyboardHandler = (event: KeyboardEvent) => void;
