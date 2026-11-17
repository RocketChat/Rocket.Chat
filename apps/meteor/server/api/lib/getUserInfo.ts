import { isOAuthUser, type IMeApiUser, type IUser, type IUserEmail, type IUserCalendar } from '@rocket.chat/core-typings';
import semver from 'semver';

import { Info } from '../../../rocketchat.info';
import { resolveUsersByIds } from '../../lib/statusVisibility/resolveUsers';
import { isUserHidingAllowed } from '../../lib/statusVisibility/settings';
import { getURL } from '../../lib/utils/getURL';
import { getUserPreference } from '../../lib/utils/lib/getUserPreference';
import { settings } from '../../settings';

const isVerifiedEmail = (me: IUser): false | IUserEmail | undefined => {
	if (!me || !Array.isArray(me.emails)) {
		return false;
	}

	return me.emails.find((email) => email.verified);
};

const getPreferencesWithDefaults = async (me: IUser): Promise<Record<string, unknown>> => {
	const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
	const allDefaultUserSettings = settings.getByRegexp(new RegExp(`^${defaultUserSettingPrefix}.*$`));

	const accumulator: Record<string, any> = {};
	for (const [key] of allDefaultUserSettings) {
		const settingWithoutPrefix = key.replace(defaultUserSettingPrefix, ' ').trim();
		accumulator[settingWithoutPrefix] = await getUserPreference(me, settingWithoutPrefix);
	}

	return accumulator;
};

const filterOutdatedVersionUpdateBanners = (banners: NonNullable<IUser['banners']>): IUser['banners'] => {
	return Object.fromEntries(
		Object.entries(banners).filter(([id]) => {
			if (!id.startsWith('versionUpdate-')) {
				return true;
			}

			const version = id.replace('versionUpdate-', '').replace(/_/g, '.');
			if (!semver.valid(version) || semver.lte(version, Info.version)) {
				return false;
			}

			return true;
		}),
	);
};

const getUserCalendar = (): IUserCalendar => {
	if (!settings.get<boolean>('Outlook_Calendar_Enabled')) {
		return {};
	}

	return {
		outlook: {
			Enabled: true,
			Outlook_Url: settings.get<string>('Outlook_Calendar_Outlook_Url'),
		},
	};
};

export async function getUserInfo(me: IUser, pullPreferences = true): Promise<IMeApiUser> {
	const verifiedEmail = isVerifiedEmail(me);

	const { statusVisibilityDenied, ...savedPreferences } = me.settings?.preferences ?? {};

	const preferences = pullPreferences
		? {
				...(await getPreferencesWithDefaults(me)),
				...savedPreferences,
				...(isUserHidingAllowed() &&
					statusVisibilityDenied?.length && {
						statusVisibilityDenied: (await resolveUsersByIds(statusVisibilityDenied)).usernames,
					}),
			}
		: undefined;

	return {
		...me,
		...(me.banners && { banners: filterOutdatedVersionUpdateBanners(me.banners) }),
		email: verifiedEmail ? verifiedEmail.address : undefined,
		settings: {
			profile: {},
			...(preferences && { preferences }),
			calendar: getUserCalendar(),
		},
		avatarUrl: getURL(`/avatar/${me.username}`, { cdn: false, full: true }),
		isOAuthUser: isOAuthUser(me),
		...(me.services && {
			services: {
				...(me.services.github && { github: me.services.github as Record<string, unknown> }),
				...(me.services.gitlab && { gitlab: me.services.gitlab as Record<string, unknown> }),
				...(me.services.email2fa?.enabled && { email2fa: { enabled: me.services.email2fa.enabled } }),
				...(me.services.totp?.enabled && { totp: { enabled: me.services.totp.enabled } }),
				password: {
					// The password hash shouldn't be leaked but the client may need to know if it exists.
					exists: Boolean(me.services?.password?.bcrypt),
				},
			},
		}),
		// Cast needed: spread of full IUser produces a superset; runtime response schema validates the actual shape
	} as IMeApiUser;
}
