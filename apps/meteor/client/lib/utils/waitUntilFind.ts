import { Tracker } from 'meteor/tracker';

export const waitUntilFind = <T>(fn: () => Promise<T | undefined>): Promise<T> =>
	new Promise((resolve) => {
		Tracker.autorun(async (c) => {
			const result = await fn();

			if (result === undefined) {
				return;
			}

			c.stop();
			resolve(result);
		});
	});
