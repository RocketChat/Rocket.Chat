import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getAvatarURL } from './getAvatarURL';
import { settings } from '../../settings';

let externalSource = '';

if (Meteor.isServer) {
	settings.get('Accounts_AvatarExternalProviderUrl', (key, value = '') => {
		externalSource = value.trim().replace(/\/$/, '');
	});
} else {
	Tracker.autorun(function() {
		externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	});
}

export const getUserAvatarURL = Meteor.isServer
	? function(username) {
		if (username == null) {
			return;
		}
		if (externalSource !== '') {
			return externalSource.replace('{username}', username);
		}
		return getAvatarURL({ username });
	}
	: function(username) {
		if (username == null) {
			return;
		}
		if (externalSource !== '') {
			return externalSource.replace('{username}', username);
		}
		const key = `avatar_random_${ username }`;
		const cache = Tracker.nonreactive(() => Session.get(key));
		return getAvatarURL({ username, cache });
	};
