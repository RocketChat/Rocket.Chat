export function assert(condition: boolean, message = 'Assertion failed'): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}
