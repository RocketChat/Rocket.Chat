import { forEachWithConcurrency } from './forEachWithConcurrency';

const from = <T>(items: T[]) =>
	(async function* () {
		yield* items;
	})();

describe('forEachWithConcurrency', () => {
	it('has no worker left running by the time it rethrows, so a caller cannot act on a failure over live work', async () => {
		let running = 0;

		const work = async (item: number) => {
			running++;

			try {
				if (item === 0) {
					throw new Error('first one blew up');
				}

				await new Promise((resolve) => setTimeout(resolve, 5));
			} finally {
				running--;
			}
		};

		await expect(forEachWithConcurrency(from([0, 1, 2, 3, 4]), 5, work)).rejects.toThrow('first one blew up');

		expect(running).toBe(0);
	});

	it('finishes the item in hand but takes no new one once a worker has thrown', async () => {
		const started: number[] = [];

		await expect(
			forEachWithConcurrency(from([0, 1, 2, 3, 4, 5, 6, 7]), 2, async (item: number) => {
				started.push(item);
				await new Promise((resolve) => setTimeout(resolve, 1));

				if (item === 0) {
					throw new Error('nope');
				}
			}),
		).rejects.toThrow('nope');

		expect(started).toEqual([0, 1]);
	});
});
