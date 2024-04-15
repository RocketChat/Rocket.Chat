import { Team } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { escapeHtml } from '../../../utils/escapeHtml';
import { validateName } from './validateName';

let usernameBlackList: RegExp[] = [];

const toRegExp = (username: string): RegExp => new RegExp(`^${escapeRegExp(username).trim()}$`, 'i');

settings.watch('Accounts_BlockedUsernameList', (value: string) => {
	usernameBlackList = ['all', 'here'].concat(value.split(',')).map(toRegExp);
});

const usernameIsBlocked = (username: string, usernameBlackList: RegExp[]): boolean | number =>
	usernameBlackList.length && usernameBlackList.some((restrictedUsername) => restrictedUsername.test(escapeRegExp(username).trim()));

export const checkUsernameAvailabilityWithValidation = async function (userId: string, username: string): Promise<boolean> {
	if (!username) {
		throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'setUsername' });
	}

	const user = await Users.findOneById(userId, { projection: { username: 1 } });

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
	}

	if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
	}

	if (user.username === username) {
		return true;
	}
	return checkUsernameAvailability(username);
};

export const checkUsernameAvailability = async function (username: string): Promise<boolean> {
	if (usernameIsBlocked(username, usernameBlackList) || !validateName(username)) {
		throw new Meteor.Error('error-blocked-username', `${escapeHtml(username)} is blocked and can't be used!`, {
			method: 'checkUsernameAvailability',
			field: username,
		});
	}

	// Make sure no users are using this username
	const existingUser = await Users.findOneByUsernameIgnoringCase(username, {
		projection: { _id: 1 },
	});
	if (existingUser) {
		return false;
	}

	// Make sure no teams are using this username
	const existingTeam = await Team.getOneByName(toRegExp(username), { projection: { _id: 1 } });
	if (existingTeam) {
		return false;
	}

	return true;
};
