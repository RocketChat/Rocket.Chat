import { Meteor } from 'meteor/meteor';

import { Federation } from '..';

import { normalizers } from '../normalizers';

export function searchUsers(query) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'searchUsers' });
	}

	const users = Federation.client.searchUsers(query);

	if (!users.length) {
		throw Federation.errors.userNotFound(query);
	}

	return normalizers.denormalizeAllUsers(users);
}
