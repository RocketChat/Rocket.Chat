import crypto from 'node:crypto';

import { api } from '@rocket.chat/core-services';
import { isBannedSubscription } from '@rocket.chat/core-typings';
import type { IInvite } from '@rocket.chat/core-typings';
import { Invites, Subscriptions, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { settings } from '../../../settings';
import { canAccessRoomAsync } from '../../authorization/canAccessRoom';
import { hasPermissionAsync } from '../../authorization/hasPermission';
import { getURL } from '../../utils/getURL';
import { roomCoordinator } from '../roomCoordinator';

function getInviteUrl(invite: Omit<IInvite, '_updatedAt'>) {
	const { inviteToken } = invite;

	const useDirectLink = settings.get<string>('Accounts_Registration_InviteUrlType') === 'direct';

	return getURL(
		`invite/${inviteToken}`,
		{
			full: useDirectLink,
			cloud: !useDirectLink,
			cloud_route: 'invite',
		},
		settings.get<string>('DeepLink_Url'),
	);
}

const possibleDays = [0, 1, 7, 15, 30];
const possibleUses = [0, 1, 5, 10, 25, 50, 100];

export const findOrCreateInvite = async (userId: string, invite: Pick<IInvite, 'rid' | 'days' | 'maxUses'>) => {
	if (!userId || !invite) {
		return false;
	}

	if (!invite.rid) {
		throw new Meteor.Error('error-the-field-is-required', 'The field rid is required', {
			method: 'findOrCreateInvite',
			field: 'rid',
		});
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links', invite.rid))) {
		throw new Meteor.Error('not_authorized');
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(invite.rid, userId, {
		projection: { _id: 1, status: 1 },
	});
	if (!subscription) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', {
			method: 'findOrCreateInvite',
			field: 'rid',
		});
	}
	if (isBannedSubscription(subscription)) {
		throw new Meteor.Error('error-user-is-banned', 'User is banned from this room', { method: 'findOrCreateInvite' });
	}

	const room = await Rooms.findOneById(invite.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', {
			method: 'findOrCreateInvite',
			field: 'rid',
		});
	}
	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Meteor.Error('not_authorized');
	}

	if (settings.get('ABAC_Enabled') && room?.abacAttributes?.length) {
		throw new Meteor.Error('error-invalid-room', 'Room is ABAC managed', {
			method: 'findOrCreateInvite',
			field: 'rid',
		});
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.INVITE, userId))) {
		throw new Meteor.Error('error-room-type-not-allowed', 'Cannot create invite links for this room type', {
			method: 'findOrCreateInvite',
		});
	}

	const { days = 1, maxUses = 0 } = invite;

	if (!possibleDays.includes(days)) {
		throw new Meteor.Error('invalid-number-of-days', 'Invite should expire in 1, 7, 15 or 30 days, or send 0 to never expire.');
	}

	if (!possibleUses.includes(maxUses)) {
		throw new Meteor.Error('invalid-number-of-uses', 'Invite should be valid for 1, 5, 10, 25, 50, 100 or infinite (0) uses.');
	}

	const existing = await Invites.findOneByUserRoomMaxUsesAndExpiration(userId, invite.rid, maxUses, days);

	if (existing) {
		existing.url = getInviteUrl(existing);
		return existing;
	}

	const _id = crypto.randomBytes(8).toString('hex');
	const inviteToken = crypto.randomUUID();

	const createdAt = new Date();
	let expires = null;
	if (days > 0) {
		expires = new Date(createdAt);
		expires.setDate(expires.getDate() + days);
	}

	const createInvite: Omit<IInvite, '_updatedAt'> = {
		_id,
		inviteToken,
		days,
		maxUses,
		rid: invite.rid,
		userId,
		createdAt,
		expires,
		url: '',
		uses: 0,
	};

	await Invites.insertOne(createInvite);

	void api.broadcast('notify.updateInvites', userId, { invite: createInvite });

	createInvite.url = getInviteUrl(createInvite);
	return createInvite;
};
