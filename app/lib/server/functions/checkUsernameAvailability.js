import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { escapeRegExp } from '../../../../lib/escapeRegExp';
import { settings } from '../../../settings';
import { Team } from '../../../../server/sdk';

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

	let result = true;

	// Make sure no users are using this username
	result = result && !Meteor.users.findOne({
		username: {
			$regex: toRegExp(username),
		},
	}, { fields: { _id: 1 } });

	// Make sure no teams are using this username
	result = result && !Promise.await(Team.getOneByName(toRegExp(username), { projection: { _id: 1 } }));

	return result;
};
