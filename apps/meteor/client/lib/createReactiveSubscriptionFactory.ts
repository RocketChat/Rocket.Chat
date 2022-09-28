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
			queueMicrotask(() => {
				callbacks.forEach((callback) => {
					callback();
				});
			});
		};

		let computation: Tracker.Computation | undefined;

		queueMicrotask(() => {
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
