import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { getAvatarURL } from './getAvatarURL';
import { settings } from '../../settings';

export const getRoomAvatarURL = function(roomId) {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{roomId}', roomId);
	}
	if (!roomId) {
		return;
	}

	const key = `room_avatar_random_${ roomId }`;
	const cache = Tracker.nonreactive(() => Session && Session.get(key)); // there is no Session on server

	return getAvatarURL({ roomId, cache });
};
