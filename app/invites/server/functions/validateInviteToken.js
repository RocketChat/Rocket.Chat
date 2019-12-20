import { Meteor } from 'meteor/meteor';

import { Invites, Rooms } from '../../../models';

export const validateInvite = (inviteData, room) => {
	if (!inviteData) {
		return false;
	}

	if (!room) {
		return false;
	}

	if (inviteData.expires && inviteData.expires <= Date.now()) {
		return false;
	}

	if (inviteData.maxUses > 0 && inviteData.uses >= inviteData.maxUses) {
		return false;
	}

	return true;
};

export const validateInviteToken = (token) => {
	if (!token) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'token' });
	}

	const inviteData = Invites.findOneById(token);
	const room = inviteData && Rooms.findOneById(inviteData.rid, { fields: { _id: 1 } });

	return validateInvite(inviteData, room);
};
