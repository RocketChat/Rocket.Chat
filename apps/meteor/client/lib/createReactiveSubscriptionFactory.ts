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

		return [
			(callback): (() => void) => {
				callbacks.add(callback);

				queueMicrotask(() => {
					if (!computation || computation.stopped) {
						computation = Tracker.autorun(reactiveFn);
					}
				});

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
