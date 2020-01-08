import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Invites } from '../../../models';

export const listInvites = (userId) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!hasPermission(userId, 'create-invite-links')) {
		throw new Meteor.Error('not_authorized');
	}

	return Invites.find({}).fetch();
};
