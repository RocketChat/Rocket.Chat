import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { beforeAddUserToRoom } from '../../../../server/hooks/rooms/beforeAddUserToRoom';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { settings } from '../../../../server/settings';

beforeAddUserToRoom.patch(async (prev, users, room, actor) => {
	await prev(users, room, actor);

	const validUsers = users.filter(Boolean);

	// Has to come before the ABAC-managed path below, which returns early for a room carrying no
	// attributes at all, precisely the room enforcement locks.
	if (validUsers.length && isRoomAbacLocked(room, getRoomAbacLockContext())) {
		throw new Error('error-abac-room-locked');
	}

	// No need to check ABAC when theres no users or when room is not private or when room is not ABAC managed
	if (!validUsers.length || room.t !== 'p' || !room?.abacAttributes?.length) {
		return;
	}

	// Throw error (prevent add) if ABAC is disabled (setting, license) but room is ABAC managed
	if (!settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		throw new Error('error-room-is-abac-managed');
	}

	await Abac.checkUsernamesMatchAttributes(validUsers as string[], room.abacAttributes, room);
});
