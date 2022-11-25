import { getAvatarURL } from './getAvatarURL';
import { settings } from '../../settings';

export const getUserAvatarURL = function (username, cache = '') {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace(/\{username\}/g, username);
	}
	if (username == null) {
		return;
	}

	return getAvatarURL({ username, cache });
};
