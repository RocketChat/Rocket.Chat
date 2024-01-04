import { Invites } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export const listInvites = async (userId: string) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links'))) {
		throw new Meteor.Error('not_authorized');
	}

	return Invites.find({}).toArray();
};
