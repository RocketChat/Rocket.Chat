import { Meteor } from 'meteor/meteor';

import * as federationErrors from './errors';
import { normalizers } from '../normalizers';
import { federationSearchUsers } from '../handler';

export function searchUsers(query) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'searchUsers' });
	}

	const users = federationSearchUsers(query);

	if (!users.length) {
		throw federationErrors.userNotFound(query);
	}

	return normalizers.denormalizeAllUsers(users);
}
