import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { escapeRegExp } from '../../../../lib/escapeRegExp';
import { settings } from '../../../settings';

let usernameBlackList = [];

const toRegExp = (username) => new RegExp(`^${ escapeRegExp(username).trim() }$`, 'i');

settings.get('Accounts_BlockedUsernameList', (key, value) => {
	usernameBlackList = ['all', 'here'].concat(value.split(',')).map(toRegExp);
});

const usernameIsBlocked = (username, usernameBlackList) => usernameBlackList.length
	&& usernameBlackList.some((restrictedUsername) => restrictedUsername.test(s.trim(escapeRegExp(username))));

export const checkUsernameAvailability = function(username) {
	if (usernameIsBlocked(username, usernameBlackList)) {
		return false;
	}

	return !Meteor.users.findOne({
		username: {
			$regex: toRegExp(username),
		},
	}, { fields: { _id: 1 } });
};
