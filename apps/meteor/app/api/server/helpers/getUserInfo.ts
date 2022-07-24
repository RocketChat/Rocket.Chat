import type { IUser, IUserEmail } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { getUserPreference, getURL } from '../../../utils/server';
import { API } from '../api';

const isVerifiedEmail = (me: IUser): false | IUserEmail | undefined => {
	if (!me || !Array.isArray(me.emails)) {
		return false;
	}

	return me.emails.find((email) => email.verified);
};

const getUserPreferences = (me: IUser): Record<string, unknown> => {
	const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
	const allDefaultUserSettings = settings.getByRegexp(new RegExp(`^${defaultUserSettingPrefix}.*$`));

	return allDefaultUserSettings.reduce((accumulator: { [key: string]: unknown }, [key]) => {
		const settingWithoutPrefix = key.replace(defaultUserSettingPrefix, ' ').trim();
		accumulator[settingWithoutPrefix] = getUserPreference(me, settingWithoutPrefix);
		return accumulator;
	}, {});
};
API.helperMethods.set('getUserInfo', function _getUserInfo(me: IUser) {
	const verifiedEmail = isVerifiedEmail(me);

	const userPreferences = (me.settings && me.settings.preferences) || {};

	return {
		...me,
		email: verifiedEmail ? verifiedEmail.address : undefined,
		settings: {
			profile: {},
			preferences: {
				...getUserPreferences(me),
				...userPreferences,
			},
		},
		avatarUrl: getURL(`/avatar/${me.username}`, { cdn: false, full: true }),
	};
});
