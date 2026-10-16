import { AbacContractError, AbacErrorCode } from '@rocket.chat/abac';
import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterUsersAllowedInRoom, filterUsersAllowedInRoomOrThrow } from '../../../../server/lib/rooms/filterUsersAllowedInRoom';
import { settings } from '../../../../server/settings';

filterUsersAllowedInRoom.patch(async (next, users, room, options) => {
	const candidates = await next(users, room, options);

	if (!candidates.length) {
		return candidates;
	}

	if (!settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return room.t === 'p' && room.abacAttributes?.length ? [] : candidates;
	}

	if (isRoomAbacLocked(room, getRoomAbacLockContext())) {
		return [];
	}

	if (!room.abacAttributes?.length) {
		return candidates;
	}

	const allowed = new Set(
		await Abac.filterUsersAllowedInRoom(
			candidates.map(({ _id }) => _id),
			room,
			{ audit: options?.audit },
		),
	);

	return candidates.filter(({ _id }) => allowed.has(_id));
});

filterUsersAllowedInRoomOrThrow.patch(async (next, users, room) => {
	const candidates = await next(users, room);

	if (!candidates.length || !settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates;
	}

	if (isRoomAbacLocked(room, getRoomAbacLockContext())) {
		throw new AbacContractError(AbacErrorCode.RoomLocked);
	}

	if (!room.abacAttributes?.length) {
		return candidates;
	}

	const evaluable = candidates.filter(({ username }) => username).map(({ _id }) => _id);
	const result = await Abac.evaluateUsersAllowedInRoom(evaluable, room, { audit: false });

	if (!result.allowed) {
		throw new AbacContractError(AbacErrorCode.DecisionUnavailable, { cause: result.code });
	}

	const allowed = new Set(result.userIds);

	return candidates.filter(({ _id }) => allowed.has(_id));
});
