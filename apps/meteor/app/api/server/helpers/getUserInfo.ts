import { isOAuthUser, type IUser, type IUserEmail, type IUserCalendar } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { getURL } from '../../../utils/server/getURL';
import { getUserPreference } from '../../../utils/server/lib/getUserPreference';

const isVerifiedEmail = (me: IUser): false | IUserEmail | undefined => {
	if (!me || !Array.isArray(me.emails)) {
		return false;
	}

	return me.emails.find((email) => email.verified);
};

const getUserPreferences = async (me: IUser): Promise<Record<string, unknown>> => {
	const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
	const allDefaultUserSettings = settings.getByRegexp(new RegExp(`^${defaultUserSettingPrefix}.*$`));

	const accumulator: Record<string, any> = {};
	for await (const [key] of allDefaultUserSettings) {
		const settingWithoutPrefix = key.replace(defaultUserSettingPrefix, ' ').trim();
		accumulator[settingWithoutPrefix] = await getUserPreference(me, settingWithoutPrefix);
	}

	return accumulator;
};

const getUserCalendar = (email: false | IUserEmail | undefined): IUserCalendar => {
	const calendarSettings: IUserCalendar = {};
	const domain = email ? (email.address.split('@').pop() ?? 'default') : 'default';
	const mapping = {
		default: {
			Enabled: settings.get<boolean>('Outlook_Calendar_Enabled'),
			Exchange_Url: settings.get<string>('Outlook_Calendar_Exchange_Url'),
			Outlook_Url: settings.get<string>('Outlook_Calendar_Outlook_Url'),
		},
		[domain]: {},
	};

	Object.assign(mapping, JSON.parse(settings.get<string>('Outlook_Calendar_Url_Mapping') || '{}'));

	if (mapping[domain].Enabled ?? mapping.default.Enabled) {
		calendarSettings.outlook = {
			Enabled: mapping[domain].Enabled ?? mapping.default.Enabled,
			Exchange_Url: mapping[domain].Exchange_Url ?? mapping.default.Exchange_Url,
			Outlook_Url: mapping[domain].Outlook_Url ?? mapping.default.Outlook_Url,
		};
	}
	return calendarSettings;
};

export async function getUserInfo(me: IUser): Promise<
	IUser & {
		email?: string;
		avatarUrl: string;
	}
> {
	const verifiedEmail = isVerifiedEmail(me);

	const userPreferences = me.settings?.preferences ?? {};

	return {
		...me,
		email: verifiedEmail ? verifiedEmail.address : undefined,
		settings: {
			profile: {},
			preferences: {
				...(await getUserPreferences(me)),
				...userPreferences,
			},
			calendar: getUserCalendar(verifiedEmail),
		},
		avatarUrl: getURL(`/avatar/${me.username}`, { cdn: false, full: true }),
		isOAuthUser: isOAuthUser(me),
		...(me.services && {
			services: {
				...(me.services.github && { github: me.services.github }),
				...(me.services.gitlab && { gitlab: me.services.gitlab }),
				...(me.services.email2fa?.enabled && { email2fa: { enabled: me.services.email2fa.enabled } }),
				...(me.services.totp?.enabled && { totp: { enabled: me.services.totp.enabled } }),
				password: {
					// The password hash shouldn't be leaked but the client may need to know if it exists.
					exists: Boolean(me.services?.password?.bcrypt),
				},
			},
		}),
	};
}
