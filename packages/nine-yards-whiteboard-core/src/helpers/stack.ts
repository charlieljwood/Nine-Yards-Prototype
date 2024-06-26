export class Stack<T> {
  private _elements: T[];

  public constructor(elements: T[] = []) {
    this._elements = elements;
  }

  public push(...elements: T[]): void {
    this._elements.push(...elements);
  }

  public pop(): T | undefined {
    return this._elements.pop();
  }

  public set(elements: T[]): void {
    this._elements = elements;
  }

  public peek(): T | undefined {
    if (this._elements.length < 1) {
      return undefined;
    }

    return this._elements.at(-1);
  }

  public isEmpty(): boolean {
    return this._elements.length === 0;
  }

  public clear(): void {
    this._elements = [];
  }

  get length(): number {
    return this._elements.length;
  }
}
