import { Subscriptions } from '@rocket.chat/models';

import { ReadReceipt } from './lib/ReadReceipt';
import { callbacks } from '../../../lib/callbacks';

callbacks.add(
	'afterSaveMessage',
	(message, room) => {
		// skips this callback if the message was edited
		if (message.editedAt) {
			return message;
		}

		if (room && !room.closedAt) {
			// set subscription as read right after message was sent
			Promise.await(Subscriptions.setAsReadByRoomIdAndUserId(room._id, message.u._id));
		}

		// mark message as read as well
		ReadReceipt.markMessageAsReadBySender(message, room, message.u._id);

		return message;
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterSaveMessage',
);

callbacks.add(
	'afterReadMessages',
	(rid, { uid, lastSeen }) => {
		ReadReceipt.markMessagesAsRead(rid, uid, lastSeen);
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterReadMessages',
);
