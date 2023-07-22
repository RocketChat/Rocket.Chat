import type { IInvite } from '@rocket.chat/core-typings';
import { Invites } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export const removeInvite = async (userId: string, invite: Pick<IInvite, '_id'>) => {
	if (!userId || !invite) {
		return false;
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links'))) {
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
