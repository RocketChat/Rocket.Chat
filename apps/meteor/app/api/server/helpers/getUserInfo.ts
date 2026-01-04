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

/**
 * Returns the user's calendar settings based on their email domain and the configured mapping.
 * If the email is not provided or the domain is not found in the mapping,
 * it returns the default Outlook calendar settings.
 * @param email - The user's email object, which may contain the address and verification status.
 * @returns The calendar settings for the user, including Outlook calendar settings if enabled.
 */
const getUserCalendar = (email: false | IUserEmail | undefined): IUserCalendar => {
	const calendarSettings: IUserCalendar = {};

	const outlook = {
		Enabled: settings.get<boolean>('Outlook_Calendar_Enabled'),
		Exchange_Url: settings.get<string>('Outlook_Calendar_Exchange_Url'),
		Outlook_Url: settings.get<string>('Outlook_Calendar_Outlook_Url'),
	};

	const domain = email ? email.address.split('@').pop() : undefined;
	const outlookCalendarUrlMapping = settings.get<string>('Outlook_Calendar_Url_Mapping');

	if (domain && outlookCalendarUrlMapping && outlookCalendarUrlMapping.includes(domain)) {
		try {
			const mappingObject = JSON.parse(outlookCalendarUrlMapping);
			const mappedSettings = mappingObject[domain];
			if (mappedSettings) {
				outlook.Enabled = mappedSettings.Enabled ?? outlook.Enabled;
				outlook.Exchange_Url = mappedSettings.Exchange_Url ?? outlook.Exchange_Url;
				outlook.Outlook_Url = mappedSettings.Outlook_Url ?? outlook.Outlook_Url;
			}
		} catch (error) {
			console.error('Invalid Outlook Calendar URL Mapping JSON:', error);
		}
	}

	if (outlook.Enabled) {
		calendarSettings.outlook = outlook;
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
