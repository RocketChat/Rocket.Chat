import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { ScheduledMessages } from '@rocket.chat/models';

import { callbacks } from '../lib/callbacks';
import { deleteHeldFiles } from '../services/scheduled-messages/heldFiles';

const deleteUserItems = async (user: IUser): Promise<void> => {
	const items = await ScheduledMessages.findByUserId(user._id).toArray();
	await ScheduledMessages.deleteByUserId(user._id);
	for await (const { files } of items) {
		await deleteHeldFiles(files);
	}
};

callbacks.add(
	'afterDeleteRoom',
	async (rid) => {
		const items = await ScheduledMessages.findByRoomId(rid).toArray();
		await ScheduledMessages.deleteByRoomId(rid);
		new Set(items.map(({ u }) => u._id)).forEach((uid) => {
			void api.broadcast('notify.scheduledMessage', uid);
		});
		return rid;
	},
	callbacks.priority.LOW,
	'scheduled-messages-delete-by-room',
);

callbacks.add('afterDeactivateUser', deleteUserItems, callbacks.priority.LOW, 'scheduled-messages-delete-on-deactivate');

callbacks.add('afterDeleteUser', deleteUserItems, callbacks.priority.LOW, 'scheduled-messages-delete-on-user-delete');
