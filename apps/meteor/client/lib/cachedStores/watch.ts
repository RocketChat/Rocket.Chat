import { Tracker } from 'meteor/tracker';
import type { UseBoundStore, StoreApi } from 'zustand';

import type { IDocumentMapStore } from '.';

/** Adds Meteor Tracker reactivity to a Zustand store lookup */
export const watch = <T, U extends { _id: string }>(
	store: UseBoundStore<StoreApi<IDocumentMapStore<U>>>,
	fn: (state: IDocumentMapStore<U>) => T,
): T => {
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
