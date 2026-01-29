import { Invites, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';

export const validateInviteToken = async (token: string) => {
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

	const room = await Rooms.findOneById(inviteData.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The invite token is invalid.', {
			method: 'validateInviteToken',
			field: 'rid',
		});
	}

	if (settings.get('ABAC_Enabled') && room?.abacAttributes?.length) {
		throw new Meteor.Error('error-invalid-room', 'Room is ABAC managed', {
			method: 'validateInviteToken',
			field: 'rid',
		});
	}

	if (inviteData.expires && new Date(inviteData.expires).getTime() <= Date.now()) {
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
