import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Invites } from '../../../models/server/raw';

export const removeInvite = async (userId, invite) => {
	if (!userId || !invite) {
		return false;
	}

	if (!hasPermission(userId, 'create-invite-links')) {
		throw new Meteor.Error('not_authorized');
	}

	if (!invite._id) {
		throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', {
			method: 'removeInvite',
			field: '_id',
		});
	}

	// Before anything, let's check if there's an existing invite
	const existing = await Invites.findOneById(invite._id);

	if (!existing) {
		throw new Meteor.Error('invalid-invitation-id', 'Invalid Invitation _id', {
			method: 'removeInvite',
		});
	}

	await Invites.removeById(invite._id);

	return true;
};
