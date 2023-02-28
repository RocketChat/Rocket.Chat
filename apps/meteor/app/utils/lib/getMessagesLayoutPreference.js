import { Meteor } from 'meteor/meteor';

import { Users } from '../../models';
import { settings } from '../../settings';

export const getMessagesLayoutPreference = (uid) => {
	const userId = uid || Meteor.userId();

	if (!userId) {
		return null;
	}
	const user = Users.findOneById(userId, { projection: { 'settings.preferences': 1 } });

	if (
		user?.settings?.preferences &&
		typeof user.settings.preferences.messagesLayout !== 'undefined' &&
		user.settings.preferences.messagesLayout !== 'default'
	) {
		return user.settings.preferences.messagesLayout;
	}
	const serverValue = settings.get(`Accounts_Default_User_Preferences_messagesLayout`);
	if (serverValue) {
		return serverValue;
	}

	return null;
};
