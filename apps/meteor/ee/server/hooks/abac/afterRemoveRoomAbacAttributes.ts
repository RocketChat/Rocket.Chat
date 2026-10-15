import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { afterRemoveRoomAbacAttributes } from '../../../../server/hooks/rooms/afterRemoveRoomAbacAttributes';
import { toAbacActor } from '../../lib/abac/toAbacActor';

const logger = new Logger('AbacRoomAttributesRemoval');

afterRemoveRoomAbacAttributes.patch(async (prev, room, actor) => {
	await prev(room, actor);

	if (!License.hasModule('abac')) {
		return;
	}

	try {
		await Abac.auditRoomAttributesRemoved(room, toAbacActor(actor));
	} catch (err) {
		logger.error({ msg: 'Failed to audit the removed ABAC attributes of a room', rid: room._id, err });
	}
});
