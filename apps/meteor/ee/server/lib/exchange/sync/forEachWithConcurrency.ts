export const forEachWithConcurrency = async <T>(
	source: AsyncIterable<T>,
	limit: number,
	worker: (item: T) => Promise<void>,
): Promise<void> => {
	const iterator = source[Symbol.asyncIterator]();

	// A limit of 0 would spawn no workers at all and resolve instantly, syncing nothing in silence.
	const workers = Math.max(1, Math.trunc(limit) || 1);

	await Promise.all(
		Array.from({ length: workers }, async () => {
			for (;;) {
				const { value, done } = await iterator.next();
				if (done) {
					return;
				}

				await worker(value);
			}
		}),
	);
};
