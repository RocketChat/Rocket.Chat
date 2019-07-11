import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

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
	const key = `avatar_random_${ username }`;
	const cache = Tracker.nonreactive(() => Session && Session.get(key)); // there is no Session on server

	return getAvatarURL({ username, cache });
};
