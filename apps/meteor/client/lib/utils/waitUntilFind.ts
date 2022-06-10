import { Tracker } from 'meteor/tracker';

export const waitUntilFind = <T>(fn: () => T | undefined): Promise<T> =>
	new Promise((resolve) => {
		Tracker.autorun((c) => {
			const result = fn();

			if (result === undefined) {
				return;
			}

			c.stop();
			resolve(result);
		});
	});
