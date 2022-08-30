import { Tracker } from 'meteor/tracker';
import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

export const useReactiveValue = <T>(computeCurrentValue: () => T): T => {
	const [subscribe, getSnapshot] = useMemo(() => {
		const callbacks = new Set<() => void>();

		let currentValue: T;

		const computation = Tracker.autorun(() => {
			currentValue = computeCurrentValue();
			callbacks.forEach((callback) => {
				callback();
			});
		});

		const { stop } = computation;

		computation.stop = (): void => undefined;

		return [
			(callback: () => void): (() => void) => {
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
	}, [computeCurrentValue]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
