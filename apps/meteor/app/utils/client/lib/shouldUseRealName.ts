import { Users } from '../../../models/client';
import { settings } from '../../../settings/client';
import { isDisplayRealNamePreference } from '../../lib/isDisplayRealNamePreference';

export const shouldUseRealName = (userId: string | null) => {
	const serverValue = isDisplayRealNamePreference(settings.get(`Accounts_Default_User_Preferences_messagesLayout`));
	if (!userId) {
		return serverValue;
	}
	const user = Users.findOneById(userId, { fields: { 'settings.preferences': 1 } });

	if (
		user?.settings?.preferences &&
		typeof user.settings.preferences.messagesLayout !== 'undefined' &&
		user.settings.preferences.messagesLayout !== 'default'
	) {
		return isDisplayRealNamePreference(user.settings.preferences.messagesLayout);
	}
	return serverValue;
};
