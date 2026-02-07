import { slice } from './slice.ts';

export function last<T>(array: ArrayLike<T>): T | undefined;
export function last<T>(array: ArrayLike<T>, n: number): T[];
export function last<T>(array: ArrayLike<T>, n?: number, guard?: any): T | T[] | undefined;
export function last<T>(array: ArrayLike<T>, n?: number, guard?: any): T | T[] | undefined {
	if (array == null) {
		return;
	}

	if (n == null || guard) {
		return array[array.length - 1];
	}

	return slice(array, Math.max(array.length - n, 0));
}
