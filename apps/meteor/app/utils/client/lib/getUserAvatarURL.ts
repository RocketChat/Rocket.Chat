import { getAvatarURL } from '../../lib/getAvatarURL';
import { settings } from '../../../settings/client';

export const getUserAvatarURL = (username: string | undefined, cache = '') => {
	if (!username) {
		return;
	}

	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}

	return getAvatarURL({ username, cache });
};
