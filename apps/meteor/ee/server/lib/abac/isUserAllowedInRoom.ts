import { Abac } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

import type { RoomAbacLockContext } from '../../../../lib/rooms/isRoomAbacLocked';
import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import type { AbacEvaluableUser } from '../../../../server/lib/rooms/filterUsersAllowedInRoom';

const logger = new Logger('AbacRoomMembership');

const EVALUATION_CONCURRENCY = 5;

/** The one membership rule behind both auto-join seams, whichever side of the pair is the list. */
export const isUserAllowedInRoom = async (user: AbacEvaluableUser, room: IRoom, lockContext: RoomAbacLockContext): Promise<boolean> => {
	if (isRoomAbacLocked(room, lockContext)) {
		return false;
	}

	if (!room.abacAttributes?.length) {
		return true;
	}

	// Compliance is evaluated by username, so a user without one cannot be cleared for an attributed room.
	if (!user.username) {
		return false;
	}

	try {
		await Abac.checkUsernamesMatchAttributes([user.username], room.abacAttributes, room);
		return true;
	} catch (err) {
		logger.info({ msg: 'User does not match the room attributes', rid: room._id, uid: user._id, err });
		return false;
	}
};

/** One PDP call per item, and neither a workspace's default rooms nor a team's membership is bounded. */
export const filterInSlices = async <T>(items: T[], allowed: (item: T) => Promise<boolean>): Promise<T[]> => {
	const kept: T[] = [];

	for (let index = 0; index < items.length; index += EVALUATION_CONCURRENCY) {
		const slice = items.slice(index, index + EVALUATION_CONCURRENCY);
		const decisions = await Promise.all(slice.map(allowed));

		kept.push(...slice.filter((_, position) => decisions[position]));
	}

	return kept;
};
