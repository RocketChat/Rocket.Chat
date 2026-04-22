/**
 * Checks whether two arrays contain the same unique elements, order-insensitive.
 * Arrays are compared as sets — duplicates within an array are ignored.
 * Uses strict equality, so values must be primitives or reference-equal.
 */
export const hasSameElements = <T>(a: readonly T[] = [], b: readonly T[] = []): boolean => {
	if (a === b) {
		return true;
	}
	const setA = new Set(a);
	const setB = new Set(b);
	if (setA.size !== setB.size) {
		return false;
	}
	for (const value of setA) {
		if (!setB.has(value)) {
			return false;
		}
	}
	return true;
};
