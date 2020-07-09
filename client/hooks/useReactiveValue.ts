import { Tracker } from 'meteor/tracker';
import { useMemo } from 'react';
import { Subscription, Unsubscribe, useSubscription } from 'use-subscription';

export const useReactiveValue = <T>(getValue: () => T): T => {
	const subscription: Subscription<T> = useMemo(() => ({
		getCurrentValue: (): T => Tracker.nonreactive(getValue) as unknown as T,
		subscribe: (callback): Unsubscribe => {
			const computation = Tracker.autorun((c) => {
				getValue();
				if (!c.firstRun) {
					callback();
				}
			});

			return (): void => {
				computation.stop();
			};
		},
	}), [getValue]);

	return useSubscription(subscription);
};
