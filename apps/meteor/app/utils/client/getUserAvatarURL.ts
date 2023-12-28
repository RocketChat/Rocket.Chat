import { settings } from '../../settings/client';
import { getAvatarURL } from './getAvatarURL';

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
