import { License } from '@rocket.chat/license';

import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterUsersAllowedInRoom } from '../../../../server/lib/rooms/filterUsersAllowedInRoom';
import { settings } from '../../../../server/settings';
import { filterInSlices, isUserAllowedInRoom } from '../../lib/abac/isUserAllowedInRoom';

filterUsersAllowedInRoom.patch(async (next, users, room) => {
	const candidates = await next(users, room);

	if (!candidates.length || !settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates;
	}

	const lockContext = getRoomAbacLockContext();

	return filterInSlices(candidates, (user) => isUserAllowedInRoom(user, room, lockContext));
});
