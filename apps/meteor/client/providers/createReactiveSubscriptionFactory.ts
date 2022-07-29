import { Tracker } from 'meteor/tracker';

interface ISubscriptionFactory<T> {
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T];
}

export const createReactiveSubscriptionFactory =
	<T>(computeCurrentValueWith: (...args: any[]) => T): ISubscriptionFactory<T> =>
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T] => {
		const computeCurrentValue = (): T => computeCurrentValueWith(...args);

		const callbacks = new Set<() => void>();

		let currentValue = computeCurrentValue();

		let computation: Tracker.Computation | undefined;
		const timeout = setTimeout(() => {
			computation = Tracker.autorun(() => {
				currentValue = computeCurrentValue();
				callbacks.forEach((callback) => {
					callback();
				});
			});
		}, 0);

		return [
			(callback): (() => void) => {
				callbacks.add(callback);

				return (): void => {
					clearTimeout(timeout);

					callbacks.delete(callback);

					if (callbacks.size === 0) {
						computation?.stop();
					}
				};
			},
			(): T => currentValue,
		];
	};
