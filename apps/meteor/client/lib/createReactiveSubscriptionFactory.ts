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

		const computation = Tracker.autorun(() => {
			currentValue = computeCurrentValue();
			callbacks.forEach((callback) => {
				Tracker.afterFlush(callback);
			});
		});

		const { stop } = computation;

		computation.stop = (): void => undefined;

		return [
			(callback): (() => void) => {
				callbacks.add(callback);

				return (): void => {
					callbacks.delete(callback);

					if (callbacks.size === 0) {
						computation.stop = stop;
						computation.stop();
					}
				};
			},
			(): T => currentValue,
		];
	};
