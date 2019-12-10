import { Meteor } from 'meteor/meteor';

import { Invites, Rooms } from '../../../models';

export const validateInviteToken = (userId, token) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'The user is invalid', { method: 'validateInviteToken', field: 'userId' });
	}
	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'token' });
	}

	const inviteData = Invites.findOneByHash(token);
	if (!inviteData) {
		return {
			valid: false,
		};
	}

	const room = Rooms.findOneById(inviteData.rid);
	if (!room) {
		return {
			valid: false,
		};
	}

	return {
		valid: true,
	};
};
