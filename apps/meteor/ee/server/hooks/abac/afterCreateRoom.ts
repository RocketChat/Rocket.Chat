import { Abac } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';

import { callbacks } from '../../../../server/lib/callbacks';
import { toAbacActor } from '../../lib/abac/toAbacActor';

const logger = new Logger('AbacRoomCreation');

callbacks.add(
	'afterCreateRoom',
	async (owner, { _id, name, abacAttributes }) => {
		if (!abacAttributes?.length) {
			return;
		}

		try {
			await Abac.auditRoomAttributesAtCreation({ _id, name, abacAttributes }, toAbacActor(owner));
		} catch (err) {
			logger.error({ msg: 'Failed to audit the ABAC attributes of a created room', rid: _id, err });
		}
	},
	callbacks.priority.LOW,
	'abac-audit-attributes-at-creation',
);
