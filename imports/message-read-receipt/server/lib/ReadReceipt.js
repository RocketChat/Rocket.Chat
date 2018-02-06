import { Random } from 'meteor/random';
import ModelReadReceipts from '../models/ReadReceipts';

const rawReadReceipts = ModelReadReceipts.model.rawCollection();

// @TODO create a debounced function by roomId, so multiple calls to same roomId runs only once

export const ReadReceipt = {
	markMessagesAsRead(roomId, userId, userLastSeen) {
		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { lm: 1 } });

		// if users last seen is greater than room's last message, it means the user already have this room marked as read
		if (userLastSeen > room.lm) {
			return;
		}

		const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);
		// console.log('userLastSeen ->', userLastSeen);
		// console.log('firstSubscription ->', firstSubscription);
		// console.log('room ->', room);

		// last time room was read is already past room's last message, so does nothing everybody have this room already
		// if (firstSubscription.ls > room.lm) {
		// 	console.log('already read by everyone');

		// 	return;
		// }

		// @TODO maybe store firstSubscription in room object so we don't need to call the above update method
		// if firstSubscription on room didn't change

		if (RocketChat.settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const receipts = RocketChat.models.Messages.findUnreadMessagesByRoomAndDate(roomId, userLastSeen).map(message => {
				return {
					_id: Random.id(),
					roomId,
					userId,
					messageId: message._id,
					ts
				};
			});

			try {
				rawReadReceipts.insertMany(receipts);
			} catch (e) {
				console.error('Error inserting read receipts per user');
			}
		}

		RocketChat.models.Messages.setAsRead(roomId, firstSubscription.ls);
	},

	getReceipts(message) {
		return ModelReadReceipts.findByMessageId(message._id).map(receipt => ({
			...receipt,
			user: RocketChat.models.Users.findOneById(receipt.userId, { fields: { username: 1, name: 1 }})
		}));
	}
};
