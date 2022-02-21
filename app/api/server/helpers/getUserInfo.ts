import { SettingValue } from '../../../../definition/ISetting';
import { IUser, IUserEmail } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { getUserPreference, getURL } from '../../../utils/server';
import { API } from '../api';

(API as any).helperMethods.set('getUserInfo', function _getUserInfo(me: IUser) {
	const isVerifiedEmail = (): IUserEmail | false => {
		if (me?.emails && Array.isArray(me.emails)) {
			return me.emails.find((email: IUserEmail) => email.verified) as IUserEmail;
		}
		return false;
	};
	const getUserPreferences = (): {} => {
		const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
		const allDefaultUserSettings = settings.getByRegexp(new RegExp(`^${defaultUserSettingPrefix}.*$`));

		return allDefaultUserSettings.reduce((accumulator: Record<string, SettingValue>, [key]) => {
			const settingWithoutPrefix = key.replace(defaultUserSettingPrefix, ' ').trim();
			accumulator[settingWithoutPrefix] = getUserPreference(me, settingWithoutPrefix);
			return accumulator;
		}, {});
	};
	const verifiedEmail = isVerifiedEmail();
	if (verifiedEmail === false) me.emails = undefined;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	else me.emails![0].address = verifiedEmail.address;

	// me.emails = verifiedEmail ? verifiedEmail.address : undefined;

	me.avatarOrigin = getURL(`/avatar/${me.username}`, { cdn: false, full: true });
	// me.avatarUrl

	const userPreferences = (me.settings && me.settings.preferences) || {};

	me.settings = {
		profile: undefined,
		preferences: {
			...getUserPreferences(),
			...userPreferences,
		},
	};

	return me;
});
