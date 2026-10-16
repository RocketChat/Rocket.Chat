import type { ISidebarFiltersDisplay, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { ensureSettingsDocument } from './updateUserFilterPreferences';
import { notifyOnUserChange } from '../notifyListener';

const DEFAULT_DISPLAY: ISidebarFiltersDisplay = { viewMode: 'medium', displayAvatar: true };

export const setSidebarFiltersDisplay = async (uid: IUser['_id'], patch: Partial<ISidebarFiltersDisplay>): Promise<void> => {
	const user = await Users.findOneById<Pick<IUser, '_id' | 'settings'>>(uid, {
		projection: { 'settings.preferences.sidebarFiltersDisplay': 1 },
	});
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const display: ISidebarFiltersDisplay = {
		...DEFAULT_DISPLAY,
		...user.settings?.preferences?.sidebarFiltersDisplay,
		...patch,
	};

	await ensureSettingsDocument(uid);
	await Users.updateOne({ _id: uid }, { $set: { 'settings.preferences.sidebarFiltersDisplay': display } });

	void notifyOnUserChange({ id: uid, clientAction: 'updated', diff: { 'settings.preferences.sidebarFiltersDisplay': display } });
};
