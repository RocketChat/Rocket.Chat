type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

const hasSubarray = (a: unknown): a is Pick<TypedArray, 'subarray'> =>
  typeof a === 'object' &&
  a !== null &&
  'subarray' in a &&
  typeof a.subarray === 'function';

const hasSet = (a: unknown): a is Pick<TypedArray, 'set'> =>
  typeof a === 'object' &&
  a !== null &&
  'set' in a &&
  typeof a.set === 'function';

export function copyArray<T>(
  src: ArrayLike<T>,
  srcPos: number,
  dest: { [index: number]: T },
  destPos: number,
  length: number,
) {
  if (hasSubarray(src) && hasSet(dest)) {
    dest.set(src.subarray(srcPos, srcPos + length), destPos);
    return;
  }

  const srcEnd = srcPos + length;
  while (srcPos < srcEnd) dest[destPos++] = src[srcPos++];
}

export function sortArray(a: TypedArray, fromIndex: number, toIndex: number) {
  const sorted = Array.from(a).slice(fromIndex, toIndex).sort();
  for (let i = fromIndex; i < toIndex; i++) {
    a[i] = sorted[i - fromIndex];
  }
}

export function fillArray(a: TypedArray, val: number): void;
export function fillArray(
  a: TypedArray,
  fromIndex: number,
  toIndex: number,
  val: number,
): void;
export function fillArray(
  ...args:
    | [a: TypedArray, val: number]
    | [a: TypedArray, fromIndex: number, toIndex: number, val: number]
) {
  if (args.length === 2) {
    const [a, val] = args;
    for (let i = 0; i < a.length; i++) {
      a[i] = val;
    }
  } else {
    const [a, fromIndex, toIndex, val] = args;
    for (let i = fromIndex; i < toIndex; i++) {
      a[i] = val;
    }
  }
}
