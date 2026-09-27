import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterUsersAllowedInRoom } from '../../../../server/lib/rooms/filterUsersAllowedInRoom';
import { settings } from '../../../../server/settings';

filterUsersAllowedInRoom.patch(async (next, users, room) => {
	const candidates = await next(users, room);

	if (!candidates.length || !settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates;
	}

	if (isRoomAbacLocked(room, getRoomAbacLockContext())) {
		return [];
	}

	if (!room.abacAttributes?.length) {
		return candidates;
	}

	const evaluable = candidates.filter(({ username }) => username).map(({ _id }) => _id);
	const allowed = new Set(await Abac.filterUsersAllowedInRoom(evaluable, room));

	return candidates.filter(({ _id }) => allowed.has(_id));
});
