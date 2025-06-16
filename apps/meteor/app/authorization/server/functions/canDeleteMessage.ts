import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { getValue } from '../../../settings/server/raw';

const elapsedTime = (ts: Date): number => {
	const dif = Date.now() - ts.getTime();
	return Math.round(dif / 1000 / 60);
};

export const canDeleteMessageAsync = async (
	uid: string,
	{ u, rid, ts }: { u: Pick<IUser, '_id' | 'username'>; rid: string; ts: Date },
): Promise<boolean> => {
	const room = await Rooms.findOneById<Pick<IRoom, '_id' | 'ro' | 'unmuted' | 't' | 'teamId' | 'prid'>>(rid, {
		projection: {
			_id: 1,
			ro: 1,
			unmuted: 1,
			t: 1,
			teamId: 1,
			prid: 1,
		},
	});

	if (!room) {
		return false;
	}

	if (!(await canAccessRoomAsync(room, { _id: uid }))) {
		return false;
	}

	const forceDelete = await hasPermissionAsync(uid, 'force-delete-message', rid);

	if (forceDelete) {
		return true;
	}

	if (!ts) {
		return false;
	}
	const deleteAllowed = await getValue('Message_AllowDeleting');

	if (!deleteAllowed) {
		return false;
	}

	const allowedToDeleteAny = await hasPermissionAsync(uid, 'delete-message', rid);

	const allowed = allowedToDeleteAny || (uid === u._id && (await hasPermissionAsync(uid, 'delete-own-message', rid)));
	if (!allowed) {
		return false;
	}
	const bypassBlockTimeLimit = await hasPermissionAsync(uid, 'bypass-time-limit-edit-and-delete', rid);

	if (!bypassBlockTimeLimit) {
		const blockDeleteInMinutes = await getValue('Message_AllowDeleting_BlockDeleteInMinutes');

		if (blockDeleteInMinutes) {
			const timeElapsedForMessage = elapsedTime(ts);
			return timeElapsedForMessage <= blockDeleteInMinutes;
		}
	}

	if (room.ro === true && !(await hasPermissionAsync(uid, 'post-readonly', rid))) {
		// Unless the user was manually unmuted
		if (u.username && !(room.unmuted || []).includes(u.username)) {
			throw new Error("You can't delete messages because the room is readonly.");
		}
	}

	return true;
};
