/**
 * Checks whether two arrays contain the same unique elements, order-insensitive.
 */
export const hasSameElements = <T>(a: readonly T[] = [], b: readonly T[] = []): boolean =>
	new Set(a).symmetricDifference(new Set(b)).size === 0;
