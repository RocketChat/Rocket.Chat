/**
 * Runs the tasks queued under one key one after another, in the order they were queued, whether or not the ones
 * before them failed. Tasks under different keys run concurrently. Only within this process.
 */
export const createKeyedQueue = () => {
	const tails = new Map<string, Promise<unknown>>();

	return <T>(key: string, task: () => Promise<T>): Promise<T> => {
		const run = (tails.get(key) ?? Promise.resolve()).then(task);
		const tail = run.catch(() => undefined);

		tails.set(key, tail);
		void tail.then(() => {
			if (tails.get(key) === tail) {
				tails.delete(key);
			}
		});

		return run;
	};
};
