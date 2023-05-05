import { getAvatarURL } from './getAvatarURL';
import { settings } from '../../settings/server';

export const getUserAvatarURL = function (username: string, cache = ''): string | undefined {
	const externalSource = (settings.get<string>('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}
	if (username == null) {
		return;
	}

	return getAvatarURL({ username, cache });
};
