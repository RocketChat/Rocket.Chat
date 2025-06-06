import { isOAuthUser, type IUser, type IUserInfo, type IUserCalendar } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { getURL } from '../../../utils/server/getURL';
import { getUserPreference } from '../../../utils/server/lib/getUserPreference';

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

const getUserCalendar = async (me: IUser): Promise<IUserCalendar> => {
	const calendarSettings: IUserCalendar = {};
	const outlook = {
		enabled: settings.get<boolean>('Outlook_Calendar_Enabled'),
		exchangeUrl: settings.get<string>('Outlook_Calendar_Exchange_Url'),
		outlookUrl: settings.get<string>('Outlook_Calendar_Outlook_Url'),
	};

	const mapping = settings.get<string>('Outlook_Calendar_Url_Mapping');
	const domain = me.emails
		?.find((e) => e.verified)
		?.address?.split('@')
		?.pop();
	if (mapping && domain && typeof mapping === 'string' && mapping.trim() !== '') {
		try {
			const mappingParsed = JSON.parse(mapping) as Record<
				string,
				{
					Enabled?: boolean;
					Exchange_Url?: string;
					Outlook_Url?: string;
					MeetingUrl_Regex?: string;
					BusyStatus_Enabled?: string;
				}
			>;

			if (mappingParsed[domain]) {
				outlook.enabled = mappingParsed[domain].Enabled ?? outlook.enabled;
				outlook.exchangeUrl = mappingParsed[domain].Exchange_Url ?? outlook.exchangeUrl;
				outlook.outlookUrl = mappingParsed[domain].Outlook_Url ?? outlook.outlookUrl;
			}
		} catch (error) {
			console.error('Error parsing Outlook Calendar URL mapping:', error);
		}
	}

	if (outlook.enabled) {
		calendarSettings.outlook = outlook;
	}

	return calendarSettings;
};

export async function getUserInfo(me: IUser): Promise<IUserInfo> {
	const verifiedEmail = me.emails?.find((e) => e.verified);
	const calendar = await getUserCalendar(me);

	const userPreferences = me.settings?.preferences ?? {};

	return {
		...me,
		email: verifiedEmail?.address,
		settings: {
			profile: {},
			preferences: {
				...(await getUserPreferences(me)),
				...userPreferences,
			},
			calendar,
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
