import { Abac, LDAPEnterprise } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { filterDefaultChannelsForUser } from '../../../../server/lib/rooms/filterDefaultChannelsForUser';
import { settings } from '../../../../server/settings';

const logger = new Logger('AbacDefaultChannels');

const EVALUATION_CONCURRENCY = 5;

filterDefaultChannelsForUser.patch(async (next, rooms, user) => {
	const candidates = await next(rooms, user);

	if (!candidates.length || !settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		return candidates;
	}

	const lockContext = getRoomAbacLockContext();
	const unlocked = candidates.filter((room) => !isRoomAbacLocked(room, lockContext));

	const { username } = user;
	const attributed = unlocked.filter((room) => room.abacAttributes?.length);

	// Nothing to evaluate against, so skip the LDAP connection the refresh below would open.
	if (!attributed.length) {
		return unlocked;
	}

	// Compliance is evaluated by username, so a user without one cannot be cleared for an attributed room.
	if (!username) {
		return unlocked.filter((room) => !room.abacAttributes?.length);
	}

	// The attributes come from the LDAP background sync, which only sees users that already existed
	// when it last ran, so a user created a moment ago carries none until this refreshes them.
	try {
		await LDAPEnterprise.syncUsersAbacAttributesByIds([user._id]);
	} catch (err) {
		logger.error({ msg: 'Failed to refresh ABAC attributes before joining the default rooms', uid: user._id, err });
	}

	const evaluate = async (room: IRoom): Promise<IRoom | undefined> => {
		if (!room.abacAttributes?.length) {
			return room;
		}

		try {
			await Abac.checkUsernamesMatchAttributes([username], room.abacAttributes, room);
			return room;
		} catch (err) {
			logger.info({ msg: 'Skipping default room, user does not match its attributes', rid: room._id, uid: user._id, err });
			return undefined;
		}
	};

	const allowed: IRoom[] = [];

	// One PDP call per attributed room, so the default rooms are walked in slices rather than all at
	// once: the list grows with every auto-join channel of every default team.
	for (let index = 0; index < unlocked.length; index += EVALUATION_CONCURRENCY) {
		const evaluated = await Promise.all(unlocked.slice(index, index + EVALUATION_CONCURRENCY).map(evaluate));

		allowed.push(...evaluated.filter((room): room is IRoom => Boolean(room)));
	}

	return allowed;
});
