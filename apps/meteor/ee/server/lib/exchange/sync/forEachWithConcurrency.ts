export const forEachWithConcurrency = async <T>(
	source: AsyncIterable<T> | Iterable<T>,
	limit: number,
	worker: (item: T) => Promise<void>,
): Promise<void> => {
	const iterator = Symbol.asyncIterator in source ? source[Symbol.asyncIterator]() : source[Symbol.iterator]();

	// A limit of 0 would spawn no workers at all and resolve instantly, syncing nothing in silence.
	const workers = Math.max(1, Math.trunc(limit) || 1);

	let failure: { err: unknown } | undefined;

	const drain = async (): Promise<void> => {
		while (!failure) {
			const { value, done } = await iterator.next();
			if (done) {
				return;
			}

			await worker(value);
		}
	};

	await Promise.all(
		Array.from({ length: workers }, () =>
			drain().catch((err) => {
				failure ??= { err };
			}),
		),
	);

	try {
		await iterator.return?.();
	} catch {
		// Closing the source must not replace the run's own outcome.
	}

	if (failure) {
		throw failure.err;
	}
};
