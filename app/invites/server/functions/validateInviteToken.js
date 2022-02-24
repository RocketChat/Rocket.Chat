import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models';
import { Invites } from '../../../models/server/raw';

export const validateInviteToken = async (token) => {
	if (!token || typeof token !== 'string') {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', {
			method: 'validateInviteToken',
			field: 'token',
		});
	}

	const inviteData = await Invites.findOneById(token);
	if (!inviteData) {
		throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', {
			method: 'validateInviteToken',
			field: 'token',
		});
	}

	const room = Rooms.findOneById(inviteData.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The invite token is invalid.', {
			method: 'validateInviteToken',
			field: 'rid',
		});
	}

	if (inviteData.expires && inviteData.expires <= Date.now()) {
		throw new Meteor.Error('error-invite-expired', 'The invite token has expired.', {
			method: 'validateInviteToken',
			field: 'expires',
		});
	}

	if (inviteData.maxUses > 0 && inviteData.uses >= inviteData.maxUses) {
		throw new Meteor.Error('error-invite-expired', 'The invite token has expired.', {
			method: 'validateInviteToken',
			field: 'maxUses',
		});
	}

	return {
		inviteData,
		room,
	};
};
