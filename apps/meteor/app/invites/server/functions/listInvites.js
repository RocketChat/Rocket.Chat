import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Invites } from '../../../models/server/raw';

export const listInvites = async (userId) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!hasPermission(userId, 'create-invite-links')) {
		throw new Meteor.Error('not_authorized');
	}

	return Invites.find({}).toArray();
};
