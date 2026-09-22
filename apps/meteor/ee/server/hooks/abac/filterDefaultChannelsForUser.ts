import { LDAPEnterprise } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterDefaultChannelsForUser } from '../../../../server/lib/rooms/filterDefaultChannelsForUser';
import { settings } from '../../../../server/settings';
import { filterInSlices, isUserAllowedInRoom } from '../../lib/abac/isUserAllowedInRoom';

const logger = new Logger('AbacDefaultChannels');

filterDefaultChannelsForUser.patch(async (next, rooms, user) => {
	const candidates = await next(rooms, user);

	if (!candidates.length || !settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates;
	}

	const lockContext = getRoomAbacLockContext();
	const unlocked = candidates.filter((room) => !isRoomAbacLocked(room, lockContext));

	// Nothing to evaluate against, so skip the LDAP connection the refresh below would open.
	if (!unlocked.some((room) => room.abacAttributes?.length)) {
		return unlocked;
	}

	// Same reason: compliance is evaluated by username, so refreshing buys a user without one nothing.
	if (!user.username) {
		return unlocked.filter((room) => !room.abacAttributes?.length);
	}

	// The attributes come from the LDAP background sync, which only sees users that already existed
	// when it last ran, so a user created a moment ago carries none until this refreshes them.
	try {
		await LDAPEnterprise.syncUsersAbacAttributesByIds([user._id]);
	} catch (err) {
		logger.error({ msg: 'Failed to refresh ABAC attributes before joining the default rooms', uid: user._id, err });
	}

	return filterInSlices(unlocked, (room) => isUserAllowedInRoom(user, room, lockContext));
});
