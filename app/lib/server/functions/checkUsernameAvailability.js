import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import _ from 'underscore';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { settings } from '../../../settings';
import { Team } from '../../../../server/sdk';
import { validateName } from './validateName';

let usernameBlackList = [];

const toRegExp = (username) => new RegExp(`^${ escapeRegExp(username).trim() }$`, 'i');

settings.get('Accounts_BlockedUsernameList', (key, value) => {
	usernameBlackList = ['all', 'here'].concat(value.split(',')).map(toRegExp);
});

const usernameIsBlocked = (username, usernameBlackList) => usernameBlackList.length
	&& usernameBlackList.some((restrictedUsername) => restrictedUsername.test(s.trim(escapeRegExp(username))));

export const checkUsernameAvailability = function(username) {
	if (usernameIsBlocked(username, usernameBlackList) || !validateName(username)) {
		throw new Meteor.Error('error-blocked-username', `${ _.escape(username) } is blocked and can't be used!`, { method: 'checkUsernameAvailability', field: username });
	}

	// Make sure no users are using this username
	const existingUser = Meteor.users.findOne({
		username: toRegExp(username),
	}, { fields: { _id: 1 } });
	if (existingUser) {
		return false;
	}

	// Make sure no teams are using this username
	const existingTeam = Promise.await(Team.getOneByName(toRegExp(username), { projection: { _id: 1 } }));
	if (existingTeam) {
		return false;
	}

	return true;
};
