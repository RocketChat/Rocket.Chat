import { Meteor } from 'meteor/meteor';

import { Invites, Rooms } from '../../../models';

export const validateInviteToken = (token) => {
	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'token' });
	}

	const inviteData = Invites.findOneById(token);
	if (!inviteData) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'token' });
	}

	const room = Rooms.findOneById(inviteData.rid, { fields: { _id: 1, name: 1, fname: 1, t: 1, prid: 1 } });
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'rid' });
	}

	if (inviteData.expires && inviteData.expires <= Date.now()) {
		throw new Meteor.Error('error-invite-expired', 'The invite token has expired.', { method: 'validateInviteToken', field: 'expires' });
	}

	if (inviteData.maxUses > 0 && inviteData.uses >= inviteData.maxUses) {
		throw new Meteor.Error('error-invite-expired', 'The invite token has expired.', { method: 'validateInviteToken', field: 'maxUses' });
	}

	return {
		inviteData,
		room,
	};
};
