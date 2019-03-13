import { callbacks } from '/app/callbacks';
import { Subscriptions } from '/app/models';
import { ReadReceipt } from './lib/ReadReceipt';

callbacks.add('afterSaveMessage', (message, room) => {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	// set subscription as read right after message was sent
	Subscriptions.setAsReadByRoomIdAndUserId(room._id, message.u._id);

	// mark message as read as well
	ReadReceipt.markMessageAsReadBySender(message, room._id, message.u._id);
});

callbacks.add('afterReadMessages', (rid, { userId, lastSeen }) => {
	ReadReceipt.markMessagesAsRead(rid, userId, lastSeen);
});
