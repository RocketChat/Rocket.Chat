import type { IUser } from '@rocket.chat/core-typings';

type WithPresenceFields = Partial<Pick<IUser, 'statusText' | 'statusSource' | 'statusExpiresAt' | 'statusDefault' | 'statusConnection'>> & {
	status?: string;
};

export const redactStatus = <T extends WithPresenceFields>(user: T): T => {
	const { statusText, statusSource, statusExpiresAt, statusDefault, statusConnection, ...rest } = user;

	return { ...rest, status: 'offline' } as T;
};

export const omitStatusVisibilityConfig = (userSettings: IUser['settings']): IUser['settings'] => {
	if (!userSettings?.preferences || !('statusVisibilityDenied' in userSettings.preferences)) {
		return userSettings;
	}

	const { statusVisibilityDenied: _denied, ...preferences } = userSettings.preferences;

	return { ...userSettings, preferences };
};
