import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';
import { Tracker } from 'meteor/tracker';
import type { StoreApi, UseBoundStore } from 'zustand';

import type { IDocumentMapStore } from '../../../client/lib/cachedCollections/DocumentMapStore';
import { Roles, Subscriptions, Users } from '../../models/client';

// Adds Meteor Tracker reactivity to a Zustand store lookup
const watch = <T, U extends { _id: string }>(
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

export const hasRole = (userId: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): boolean => {
	const roleScope = watch(Roles.use, (state) => state.get(roleId)?.scope ?? 'Users');

	switch (roleScope) {
		case 'Subscriptions':
			if (!scope) return false;

			return watch(Subscriptions.use, (state) => state.find((record) => record.rid === scope)?.roles?.includes(roleId) ?? false);

		case 'Users':
			return watch(Users.use, (state) => state.get(userId)?.roles?.includes(roleId) ?? false);

		default:
			return false;
	}
};
