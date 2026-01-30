import { Tracker } from 'meteor/tracker';
import type { StoreApi, UseBoundStore } from 'zustand';

/** Adds Meteor Tracker reactivity to a Zustand store lookup */
export const watch = <T, U>(store: UseBoundStore<StoreApi<U>>, fn: (state: U) => T): T => {
	const value = fn(store.getState());

	const computation = Tracker.currentComputation;

	if (computation) {
		const unsubscribe = store.subscribe((state) => {
			const newValue = fn(state);
			if (newValue !== value) {
				computation.invalidate();
			}
		});

		computation.onInvalidate(() => {
			unsubscribe();
		});
	}

	return value;
};
