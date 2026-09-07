import type { IUser } from '@rocket.chat/core-typings';

type WithPresenceFields = Partial<Pick<IUser, 'statusText' | 'statusSource' | 'statusExpiresAt' | 'statusConnection'>> & {
	status?: string;
	statusDefault?: string;
};

export const redactStatus = <T extends WithPresenceFields>(user: T, redact = true): T => {
	if (!redact) {
		return user;
	}

	const { statusText, statusSource, statusExpiresAt, statusDefault, ...rest } = user;

	return { ...rest, status: 'offline', statusConnection: 'offline' } as T;
};

export const omitStatusVisibilityConfig = (userSettings: IUser['settings']): IUser['settings'] => {
	if (!userSettings?.preferences || !('statusVisibilityDenied' in userSettings.preferences)) {
		return userSettings;
	}

	const { statusVisibilityDenied: _denied, ...preferences } = userSettings.preferences;

	return { ...userSettings, preferences };
};
