import { ScheduledMessage } from '@rocket.chat/core-services';

import { callbacks } from '../lib/callbacks';

callbacks.add(
	'afterDeleteRoom',
	async (rid) => {
		await ScheduledMessage.deleteByRoomId(rid);
		return rid;
	},
	callbacks.priority.LOW,
	'scheduled-messages-delete-by-room',
);

callbacks.add(
	'afterDeactivateUser',
	({ _id }) => ScheduledMessage.deleteByUserId(_id),
	callbacks.priority.LOW,
	'scheduled-messages-delete-on-deactivate',
);

callbacks.add(
	'afterDeleteUser',
	({ _id }) => ScheduledMessage.deleteByUserId(_id),
	callbacks.priority.LOW,
	'scheduled-messages-delete-on-user-delete',
);
