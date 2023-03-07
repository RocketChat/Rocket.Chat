import { Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { isDisplayRealNamePreference } from '../../lib/isDisplayRealNamePreference';

export const shouldUseRealName = (userId: string | null) => {
	const serverValue = isDisplayRealNamePreference(settings.get(`Accounts_Default_User_Preferences_messagesLayout`));
	if (!userId) {
		return serverValue;
	}
	const user = Promise.await(Users.findOneById(userId, { projection: { 'settings.preferences': 1 } }));

	if (
		user?.settings?.preferences &&
		typeof user.settings.preferences.messagesLayout !== 'undefined' &&
		user.settings.preferences.messagesLayout !== 'default'
	) {
		return isDisplayRealNamePreference(user.settings.preferences.messagesLayout);
	}
	return serverValue;
};
