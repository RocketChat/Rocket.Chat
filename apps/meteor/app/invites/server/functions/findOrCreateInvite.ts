import { api } from '@rocket.chat/core-services';
import type { IInvite } from '@rocket.chat/core-typings';
import { Invites, Subscriptions, Rooms } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { getURL } from '../../../utils/server/getURL';

function getInviteUrl(invite: Omit<IInvite, '_updatedAt'>) {
	const { _id } = invite;

	const useDirectLink = settings.get<string>('Accounts_Registration_InviteUrlType') === 'direct';

	return getURL(
		`invite/${_id}`,
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
		projection: { _id: 1 },
	});
	if (!subscription) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', {
			method: 'findOrCreateInvite',
			field: 'rid',
		});
	}

	const room = await Rooms.findOneById(invite.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', {
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

	// Before anything, let's check if there's an existing invite with the same settings for the same channel and user and that has not yet expired.
	const existing = await Invites.findOneByUserRoomMaxUsesAndExpiration(userId, invite.rid, maxUses, days);

	// If an existing invite was found, return it's _id instead of creating a new one.
	if (existing) {
		existing.url = getInviteUrl(existing);
		return existing;
	}

	const _id = Random.id(6);

	// insert invite
	const createdAt = new Date();
	let expires = null;
	if (days > 0) {
		expires = new Date(createdAt);
		expires.setDate(expires.getDate() + days);
	}

	const createInvite: Omit<IInvite, '_updatedAt'> = {
		_id,
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
