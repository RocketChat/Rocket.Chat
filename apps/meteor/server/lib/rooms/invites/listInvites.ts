import type { IInviteSummary } from '@rocket.chat/core-typings';
import { Invites, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../authorization/hasPermission';

export const listInvites = async (userId: string): Promise<IInviteSummary[]> => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!(await hasPermissionAsync(userId, 'manage-invite-links'))) {
		throw new Meteor.Error('not_authorized');
	}

	const invites = await Invites.findInvitesForManagement().toArray();
	if (!invites.length) {
		return [];
	}

	const rids = [...new Set(invites.map((invite) => invite.rid))];
	const rooms = await Rooms.findByIds(rids, { projection: { name: 1, fname: 1 } }).toArray();
	const roomNameByRid = new Map(rooms.map((room) => [room._id, room.fname || room.name]));

	return invites.map(({ _id, _updatedAt, rid, userId, createdAt, expires, days, maxUses, uses, legacy }) => ({
		_id,
		_updatedAt,
		rid,
		userId,
		createdAt,
		expires,
		days,
		maxUses,
		uses,
		...(legacy !== undefined && { legacy }),
		roomName: roomNameByRid.get(rid),
	}));
};
