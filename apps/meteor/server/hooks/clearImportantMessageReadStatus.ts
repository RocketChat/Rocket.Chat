import { Messages } from '@rocket.chat/models';

import { callbacks } from '../lib/callbacks';
import { afterRemoveFromRoomCallback } from '../lib/callbacks/afterRemoveFromRoomCallback';

afterRemoveFromRoomCallback.add(
	async ({ removedUser }, room) => {
		if (!removedUser?._id || !room?._id) {
			return;
		}

		console.log('[clearImportantMessageReadStatus] User removed from room:', {
			userId: removedUser._id,
			roomId: room._id,
		});

		try {
			const result = await Messages.updateMany(
				{
					rid: room._id,
					isImportant: true,
					importantReadBy: removedUser._id,
				},
				{
					$pull: { importantReadBy: removedUser._id },
				},
			);

			console.log('[clearImportantMessageReadStatus] Cleared read status:', {
				userId: removedUser._id,
				roomId: room._id,
				modifiedCount: result.modifiedCount,
			});
		} catch (error) {
			console.error('[clearImportantMessageReadStatus] Error clearing read status:', error);
		}
	},
	callbacks.priority.HIGH,
	'clear-important-message-read-status',
);
