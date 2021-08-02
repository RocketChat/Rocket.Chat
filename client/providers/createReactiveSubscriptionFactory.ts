import { Tracker } from 'meteor/tracker';
import { Subscription, Unsubscribe } from 'use-subscription';

interface ISubscriptionFactory<T> {
	(...args: any[]): Subscription<T>;
}

export const createReactiveSubscriptionFactory =
	<T>(computeCurrentValueWith: (...args: any[]) => T): ISubscriptionFactory<T> =>
	(...args: any[]): Subscription<T> => {
		const computeCurrentValue = (): T => computeCurrentValueWith(...args);

		const callbacks = new Set<Unsubscribe>();

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

		return {
			getCurrentValue: (): T => currentValue,
			subscribe: (callback): Unsubscribe => {
				callbacks.add(callback);

				return (): void => {
					clearTimeout(timeout);

					callbacks.delete(callback);

					if (callbacks.size === 0) {
						computation && computation.stop();
					}
				};
			},
		};
	};
