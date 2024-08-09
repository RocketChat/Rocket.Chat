import { settings } from '../../settings/server';
import { getAvatarURL } from './getAvatarURL';

export const getUserAvatarURL = function (username: string, cache = ''): string | undefined {
	const externalSource = (settings.get<string>('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	const externalSourceProxy = (settings.get<boolean>('Accounts_AvatarExternalProviderProxy') || false)
	if (externalSource !== '' && !externalSourceProxy) {
		return externalSource.replace('{username}', username);
	}
	if (username == null) {
		return;
	}

	return getAvatarURL({ username, cache });
};
