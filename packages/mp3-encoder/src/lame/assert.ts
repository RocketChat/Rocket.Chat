export function assert(condition: boolean, message?: string): asserts condition {
	if (!condition) {
		console.assert(condition, message);
		// TODO: There is a condition generating multiple NaN values that was never
		//       addressed in the original code and is not clear how to handle it.
		//       Originally this assertion was commented out, probably because of it.
		// throw new Error(message);
	}
}
