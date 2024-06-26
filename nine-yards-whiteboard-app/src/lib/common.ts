export function findCommonObject<T extends Object>(objects: readonly T[]): Partial<T> {
  if (objects.length < 1) {
    return {};
  }

  if (objects.length === 1) {
    return objects[0];
  }

  const commonProperties: Partial<T> = {};
  const keys = Object.keys(objects[0]) as (keyof T)[];

  for (const key of keys) {
    const commonValue = objects[0][key];

    const isCommon = objects.every(
      (object) => object[key] === commonValue,
    );

    if (isCommon) {
      commonProperties[key] = commonValue;
    }
  }

  return commonProperties;
};
