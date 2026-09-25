import { Abac } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';

import { callbacks } from '../../../../server/lib/callbacks';
import { toAbacActor } from '../../lib/abac/toAbacActor';

const logger = new Logger('AbacRoomCreation');

// Written here rather than in the creation guard because only now does the room have an id.
callbacks.add(
	'afterCreateRoom',
	async (owner, room) => {
		if (!room.abacAttributes?.length) {
			return;
		}

		try {
			await Abac.auditRoomAttributesAtCreation(room, toAbacActor(owner));
		} catch (err) {
			logger.error({ msg: 'Failed to audit the ABAC attributes of a created room', rid: room._id, err });
		}
	},
	callbacks.priority.LOW,
	'abac-audit-attributes-at-creation',
);
