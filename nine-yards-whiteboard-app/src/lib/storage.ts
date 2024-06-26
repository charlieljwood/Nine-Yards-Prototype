export function loadFromStorage<T extends Object>(
  key: string,
  fallback: T
): T {
  const stored = localStorage.getItem(key);

  if (!stored) {
    return fallback;
  }

  return JSON.parse(stored);
}

export function saveToStorage<T extends Object>(
  key: string,
  data: T
): void {
  const serialized = JSON.stringify(data);
  localStorage.setItem(key, serialized);
}
