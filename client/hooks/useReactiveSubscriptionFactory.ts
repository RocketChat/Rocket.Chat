import { Tracker } from 'meteor/tracker';
import { useCallback } from 'react';
import { Subscription, Unsubscribe } from 'use-subscription';

interface ISubscriptionFactory<T> {
	(...args: any[]): Subscription<T>;
}

export const useReactiveSubscriptionFactory = <T>(fn: (...args: any[]) => T): ISubscriptionFactory<T> =>
	useCallback<ISubscriptionFactory<T>>((...args: any[]) => {
		const fnWithArgs = (): T => fn(...args);

		return {
			getCurrentValue: (): T => Tracker.nonreactive(fnWithArgs) as unknown as T,
			subscribe: (callback): Unsubscribe => {
				const computation = Tracker.autorun((c) => {
					fnWithArgs();
					if (!c.firstRun) {
						callback();
					}
				});

				return (): void => {
					computation.stop();
				};
			},
		};
	}, [fn]);
