import { Messages } from '@rocket.chat/models';

import { callbacks } from '../lib/callbacks';
import { afterRemoveFromRoomCallback } from '../lib/callbacks/afterRemoveFromRoomCallback';

afterRemoveFromRoomCallback.add(
	async ({ removedUser }, room) => {
		if (!removedUser?._id || !room?._id) {
			return;
		}

		await Messages.updateMany(
			{
				rid: room._id,
				isImportant: true,
				importantReadBy: removedUser._id,
			},
			{
				$pull: { importantReadBy: removedUser._id },
			},
		);
	},
	callbacks.priority.HIGH,
	'clear-important-message-read-status',
);
