import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { Invites, Rooms } from '../../../models';
import { settings } from '../../../settings';

function getInviteUrl(invite, roomName) {
	const { rid, hash } = invite;

	const address = settings.get('Site_Url');
	const host = address.replace(/https?\:\/\//i, '');
	const url = `https://go.rocket.chat/${ roomName }?host=${ host }&rid=${ rid }&path=channel/${ roomName }&token=${ hash }`;

	return url;
}

export const findOrCreateInvite = (userId, invite) => {
	if (!userId || !invite) {
		return false;
	}

	if (!hasPermission(userId, 'create-invite-links')) {
		throw new Meteor.Error('not_authorized');
	}

	if (!invite.rid) {
		throw new Meteor.Error('error-the-field-is-required', 'The field rid is required', { method: 'findOrCreateInvite', field: 'rid' });
	}

	const room = Rooms.findOneById(invite.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'The rid field is invalid', { method: 'findOrCreateInvite', field: 'rid' });
	}

	let { days, maxUses } = invite;
	const possibleDays = [0, 1, 7, 15, 30];
	const possibleUses = [0, 1, 5, 10, 25, 50, 100];

	if (!possibleDays.includes(days)) {
		days = 1;
	}

	if (!possibleUses.includes(maxUses)) {
		maxUses = 0;
	}

	// Before anything, let's check if there's an existing invite with the same settings for the same channel and user and that has not yet expired.
	const query = {
		rid: invite.rid,
		userId,
		days,
		maxUses,
	};

	if (days > 0) {
		query.expires = {
			$gt: new Date(),
		};
	}

	if (maxUses > 0) {
		query.uses = 0;
	}

	// If an existing invite was found, return it's hash instead of creating a new one.
	const existing = Invites.find(query).fetch();
	if (existing && existing.length) {
		return {
			hash: existing[0].hash,
			url: getInviteUrl(existing[0], room.fname),
			days: existing[0].days,
			maxUses: existing[0].maxUses,
			uses: existing[0].uses,
			expires: existing[0].expires,
		};
	}

	const hash = Random.id();

	// insert invite
	const now = new Date();
	let expires = null;
	if (days > 0) {
		expires = new Date(now);
		expires.setDate(expires.getDate() + days);
	}

	const createInvite = {
		hash,
		days,
		maxUses,
		rid: invite.rid,
		userId,
		createdAt: now,
		expires,
		uses: 0,
	};

	Invites.create(createInvite);

	Notifications.notifyLogged('updateInvites', { invite: createInvite });
	return {
		hash,
		url: getInviteUrl(createInvite, room.fname),
		days,
		maxUses,
		uses: 0,
		expires,
	};
};
