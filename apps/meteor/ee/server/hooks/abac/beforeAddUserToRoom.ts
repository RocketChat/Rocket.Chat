import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { beforeAddUserToRoom } from '../../../../server/hooks/rooms/beforeAddUserToRoom';
import { isRoomLockedByAbac } from '../../../../server/lib/authorization/isRoomLocked';
import { settings } from '../../../../server/settings';

beforeAddUserToRoom.patch(async (prev, users, room, actor) => {
	await prev(users, room, actor);

	const validUsers = users.filter(Boolean);

	// ABAC-P4 — a locked room accepts no new members, whichever way it is non-compliant. This has
	// to come before the ABAC-managed path below, which returns early for a room carrying no
	// attributes at all — precisely the room enforcement locks.
	if (validUsers.length && isRoomLockedByAbac(room)) {
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
