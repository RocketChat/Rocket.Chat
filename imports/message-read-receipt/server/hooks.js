import { ReadReceipt } from './lib/ReadReceipt';

RocketChat.callbacks.add('afterSaveMessage', (message, room) => {

	// set subscription as read right after message was sent
	RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(room._id, message.u._id);

	// mark message as read as well
	ReadReceipt.markMessageAsReadBySender(message, room._id, message.u._id);
});
