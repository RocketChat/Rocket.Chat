export function last<T>(array: ArrayLike<T>): T | undefined {
	if (array.length === 0) {
		return undefined;
	}

	return array[array.length - 1];
}
