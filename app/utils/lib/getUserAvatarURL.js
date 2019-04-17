import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { settings } from '../../settings';
import { getAvatarURL } from './getAvatarURL';

export const getUserAvatarURL = function(username) {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}
	if (username == null) {
		return;
	}
	const key = `avatar_random_${ username }`;
	const cache = Tracker.nonreactive(() => Session.get(key));

	return getAvatarURL({ username, cache });
};
