import { IUserCreationOptions } from '@rocket.chat/apps-engine/definition/users';

import { IUser, IUserEmail } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { getUserPreference, getURL } from '../../../utils/server';
import { API } from '../api';

(API as any).helperMethods.set('getUserInfo', function _getUserInfo(me: IUser) {
	const isVerifiedEmail = (): false | IUserEmail | undefined => {
		if (me?.emails && Array.isArray(me.emails)) {
			return me.emails.find((email) => email.verified);
		}
		return false;
	};
	const getUserPreferences = (): {} => {
		const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
		const allDefaultUserSettings = settings.getByRegexp(new RegExp(`^${defaultUserSettingPrefix}.*$`));

		return allDefaultUserSettings.reduce((accumulator: { [key: string]: unknown }, [key]) => {
			const settingWithoutPrefix = key.replace(defaultUserSettingPrefix, ' ').trim();
			accumulator[settingWithoutPrefix] = getUserPreference(me, settingWithoutPrefix);
			return accumulator;
		}, {});
	};
	const verifiedEmail = isVerifiedEmail();

	if (verifiedEmail && me.emails?.[0]) me.emails[0] = verifiedEmail;
	else me.emails = undefined;

	// me.emails[0] = verifiedEmail ? verifiedEmail.address : undefined;

	// me.options.avatarUrl
	(me as IUserCreationOptions).avatarUrl = getURL(`/avatar/${me.username}`, { cdn: false, full: true });

	const userPreferences = (me.settings && me.settings.preferences) || {};

	me.settings = {
		profile: {},
		preferences: {
			...getUserPreferences(),
			...userPreferences,
		},
	};

	return me;
});
