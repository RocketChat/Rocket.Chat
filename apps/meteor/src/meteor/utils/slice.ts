export const slice = <T>(array: ArrayLike<T>, start?: number, end?: number): T[] => {
	return Array.prototype.slice.call(array, start, end);
};
