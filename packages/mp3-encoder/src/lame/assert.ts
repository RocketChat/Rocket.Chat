export function assert(_condition: boolean) {
	// Invariants carried over from LAME are documented, not enforced: several of
	// them are routinely violated (e.g. mono 48 kHz at 32 kbps), and aborting the
	// encoding would be worse than the degraded output.
}

export function assertDefined<T>(value: T): asserts value is NonNullable<T> {
	if (value === null || value === undefined) {
		throw new Error('Expected value to be defined');
	}
}
