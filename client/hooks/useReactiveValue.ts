import { Tracker } from 'meteor/tracker';
import { useMemo } from 'react';
import { Subscription, Unsubscribe, useSubscription } from 'use-subscription';

export const useReactiveValue = <T>(computeCurrentValue: () => T): T => {
	const subscription: Subscription<T> = useMemo(() => {
		const callbacks = new Set<Unsubscribe>();

		let currentValue: T;

		const computation = Tracker.autorun(() => {
			currentValue = computeCurrentValue();
			callbacks.forEach((callback) => {
				callback();
			});
		});

		return {
			getCurrentValue: (): T => currentValue,
			subscribe: (callback): Unsubscribe => {
				callbacks.add(callback);

				return (): void => {
					callbacks.delete(callback);

					if (callbacks.size === 0) {
						computation.stop();
					}
				};
			},
		};
	}, [computeCurrentValue]);

	return useSubscription(subscription);
};
