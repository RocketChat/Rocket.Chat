import { ReadReceipts } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'afterDeleteRoom',
	async (rid) => {
		await ReadReceipts.removeByRoomId(rid);
		return rid;
	},
	callbacks.priority.LOW,
	'DeleteReadReceipts',
);
