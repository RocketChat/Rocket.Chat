import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterDefaultChannelsForUser } from '../../../../server/lib/rooms/filterDefaultChannelsForUser';
import { settings } from '../../../../server/settings';

filterDefaultChannelsForUser.patch(async (next, rooms, user, options) => {
	const candidates = await next(rooms, user, options);

	if (!candidates.length) {
		return candidates;
	}

	if (!settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates.filter((room) => room.t !== 'p' || !room.abacAttributes?.length);
	}

	const lockContext = getRoomAbacLockContext();
	const unlocked = candidates.filter((room) => !isRoomAbacLocked(room, lockContext));
	const attributed = unlocked.filter((room) => room.abacAttributes?.length);

	if (!attributed.length) {
		return unlocked;
	}

	if (!user.username) {
		return unlocked.filter((room) => !room.abacAttributes?.length);
	}

	const allowed = new Set(
		await Abac.filterRoomsAllowedForUser(user._id, attributed, {
			refreshAttributes: options?.refreshUserAttributes && user.ldap === true,
			audit: options?.audit,
		}),
	);

	return unlocked.filter((room) => !room.abacAttributes?.length || allowed.has(room._id));
});
