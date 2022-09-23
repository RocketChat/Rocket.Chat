import { Tracker } from 'meteor/tracker';

import { queueMicrotask } from './utils/queueMicrotask';

interface ISubscriptionFactory<T> {
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T];
}

export const createReactiveSubscriptionFactory =
	<T>(computeCurrentValueWith: (...args: any[]) => T): ISubscriptionFactory<T> =>
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T] => {
		const callbacks = new Set<() => void>();

		let currentValue = computeCurrentValueWith(...args);

		const reactiveFn = (): void => {
			currentValue = computeCurrentValueWith(...args);
			callbacks.forEach((callback) => {
				queueMicrotask(callback);
			});
		};

		let computation: Tracker.Computation | undefined;

		queueMicrotask(() => {
			if (Tracker.currentComputation) {
				throw new Error('Cannot call createReactiveSubscriptionFactory inside a Tracker computation');
			}

			computation = Tracker.autorun(reactiveFn);
		});

		return [
			(callback): (() => void) => {
				callbacks.add(callback);

				return (): void => {
					callbacks.delete(callback);

					if (callbacks.size === 0) {
						queueMicrotask(() => computation?.stop());
					}
				};
			},
			(): T => currentValue,
		];
	};
