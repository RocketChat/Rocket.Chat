import type { IUser, ISidebarFilter, ISubscriptionLabel } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnUserChange } from '../notifyListener';

export type FilterPreferences = {
	subscriptionLabels: ISubscriptionLabel[];
	sidebarFilters: ISidebarFilter[];
};

const REVISION_KEY = 'settings.preferences.sidebarFiltersRevision';

const MAX_RETRIES = 3;

const readFilterPreferences = (user: Pick<IUser, 'settings'>): FilterPreferences => {
	const preferences = user.settings?.preferences;
	return {
		subscriptionLabels: Array.isArray(preferences?.subscriptionLabels) ? preferences.subscriptionLabels : [],
		sidebarFilters: Array.isArray(preferences?.sidebarFilters) ? preferences.sidebarFilters : [],
	};
};

/** Lets preference writes land on users whose `settings` is still `null`. */
export const ensureSettingsDocument = (uid: IUser['_id']) =>
	Users.updateOne({ _id: uid, settings: { $type: 'null' } }, { $set: { settings: {} } });

/**
 * Applies `mutate` to the user's labels and filters as one atomic step, retrying when a concurrent write
 * lands in between, and broadcasts the changed keys.
 */
export async function updateUserFilterPreferences<T>(
	uid: IUser['_id'],
	mutate: (current: FilterPreferences) => { next: Partial<FilterPreferences>; result: T },
): Promise<T> {
	await ensureSettingsDocument(uid);

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const user = await Users.findOneById<Pick<IUser, '_id' | 'settings'>>(uid, {
			projection: {
				'settings.preferences.subscriptionLabels': 1,
				'settings.preferences.sidebarFilters': 1,
				'settings.preferences.sidebarFiltersRevision': 1,
			},
		});
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const { next, result } = mutate(readFilterPreferences(user));

		const revision: number | undefined = user.settings?.preferences?.sidebarFiltersRevision;
		const $set = Object.fromEntries(Object.entries(next).map(([key, value]) => [`settings.preferences.${key}`, value]));

		const { matchedCount } = await Users.updateOne(
			{ _id: uid, [REVISION_KEY]: revision ?? { $exists: false } },
			{ $set, $inc: { [REVISION_KEY]: 1 } },
		);

		if (matchedCount === 0) {
			continue;
		}

		void notifyOnUserChange({ id: uid, clientAction: 'updated', diff: $set });

		return result;
	}

	throw new Meteor.Error('error-concurrent-update', 'Labels and filters were changed concurrently, try again');
}
