import { getAvatarURL } from './getAvatarURL';
import { settings } from '../../settings';

export const getUserAvatarURL = function(username) {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}
	if (username == null) {
		return;
	}

	const cache = !!localStorage && localStorage.getItem(`avatar_random_${ username }`); // there is no Session on server

	return getAvatarURL({ username, cache });
};
