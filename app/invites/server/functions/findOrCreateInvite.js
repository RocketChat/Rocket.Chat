import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { Invites, Subscriptions, Rooms } from '../../../models/server';
import { settings } from '../../../settings';
import { getURL } from '../../../utils/lib/getURL';
import { roomTypes, RoomMemberActions } from '../../../utils/server';

function getInviteUrl(invite) {
	const { _id } = invite;

	const useDirectLink = settings.get('Accounts_Registration_InviteUrlType') === 'direct';

	return getURL(`invite/${ _id }`, {
		full: useDirectLink,
		cloud: !useDirectLink,
		cloud_route: 'invite',
	});
}

const possibleDays = [0, 1, 7, 15, 30];
const possibleUses = [0, 1, 5, 10, 25, 50, 100];

export const findOrCreateInvite = (userId, invite) => {
	if (!userId || !invite) {
		return false;
	}

	if (!invite.rid) {
		throw new Meteor.Error('error-the-field-is-required', 'The field rid is required', { method: 'findOrCreateInvite', field: 'rid' });
	}

	if (!hasPermission(userId, 'create-invite-links', invite.rid)) {
		throw new Meteor.Error('not_authorized');
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(invite.rid, userId, { fields: { _id: 1 } });
	if (!subscription) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', { method: 'findOrCreateInvite', field: 'rid' });
	}

	const room = Rooms.findOneById(invite.rid);
	if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.INVITE)) {
		throw new Meteor.Error('error-room-type-not-allowed', 'Cannot create invite links for this room type', { method: 'findOrCreateInvite' });
	}

	let { days, maxUses } = invite;

	if (!possibleDays.includes(days)) {
		days = 1;
	}

	if (!possibleUses.includes(maxUses)) {
		maxUses = 0;
	}

	// Before anything, let's check if there's an existing invite with the same settings for the same channel and user and that has not yet expired.
	const existing = Invites.findOneByUserRoomMaxUsesAndExpiration(userId, invite.rid, maxUses, days);

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

	const createInvite = {
		_id,
		days,
		maxUses,
		rid: invite.rid,
		userId,
		createdAt,
		expires,
		uses: 0,
	};

	Invites.create(createInvite);
	Notifications.notifyUser(userId, 'updateInvites', { invite: createInvite });

	createInvite.url = getInviteUrl(createInvite);
	return createInvite;
};
