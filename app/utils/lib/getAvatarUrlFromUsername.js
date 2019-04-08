import { Session } from 'meteor/session';
import { settings } from '../../settings';
import { getAvatarURL } from './getAvatarURL';

export const getAvatarUrlFromUsername = function(username) {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}
	if (username == null) {
		return;
	}
	const key = `avatar_random_${ username }`;
	const random = typeof Session !== 'undefined' && typeof Session.keys[key] !== 'undefined' ? Session.keys[key] : 0;

	return getAvatarURL(`${ encodeURIComponent(username) }?_dc=${ random }`);
};
