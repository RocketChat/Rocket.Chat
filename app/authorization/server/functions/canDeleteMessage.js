import { hasPermissionAsync } from './hasPermission';
import { getValue } from '../../../settings/server/raw';
import { Rooms } from '../../../models';

const elapsedTime = (ts) => {
	const dif = Date.now() - ts;
	return Math.round(dif / 1000 / 60);
};

export const canDeleteMessageAsync = async (uid, { u, rid, ts }) => {
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
	const blockDeleteInMinutes = await getValue('Message_AllowDeleting_BlockDeleteInMinutes');

	if (blockDeleteInMinutes) {
		const timeElapsedForMessage = elapsedTime(ts);
		return timeElapsedForMessage <= blockDeleteInMinutes;
	}

	const room = await Rooms.findOneById(rid, { fields: { ro: 1, unmuted: 1 } });
	if (room.ro === true && !(await hasPermissionAsync(uid, 'post-readonly', rid))) {
		// Unless the user was manually unmuted
		if (!(room.unmuted || []).includes(u.username)) {
			throw new Error("You can't delete messages because the room is readonly.");
		}
	}

	return true;
};

export const canDeleteMessage = (uid, { u, rid, ts }) => Promise.await(canDeleteMessageAsync(uid, { u, rid, ts }));
