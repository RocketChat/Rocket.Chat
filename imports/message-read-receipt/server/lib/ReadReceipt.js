import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ReadReceipts, Subscriptions, Messages, Rooms, Users } from '../../../../app/models';
import { settings } from '../../../../app/settings';

const rawReadReceipts = ReadReceipts.model.rawCollection();

// debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once
const list = {};
const debounceByRoomId = function(fn) {
	return function(roomId, ...args) {
		clearTimeout(list[roomId]);
		list[roomId] = setTimeout(() => { fn.call(this, roomId, ...args); }, 2000);
	};
};

const updateMessages = debounceByRoomId(Meteor.bindEnvironment((roomId) => {
	// @TODO maybe store firstSubscription in room object so we don't need to call the above update method
	const firstSubscription = Subscriptions.getMinimumLastSeenByRoomId(roomId);
	Messages.setAsRead(roomId, firstSubscription.ls);
	const isTheLastMessageRead = Rooms.isTheLastMessageRead(roomId, firstSubscription.ls);
	if (isTheLastMessageRead) {
		Rooms.setLastMessageAsRead(roomId);
	}
}));

export const ReadReceipt = {
	markMessagesAsRead(roomId, userId, userLastSeen) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const room = Rooms.findOneById(roomId, { fields: { lm: 1 } });

		// if users last seen is greadebounceByRoomIdter than room's last message, it means the user already have this room marked as read
		if (userLastSeen > room.lm) {
			return;
		}

		if (userLastSeen) {
			this.storeReadReceipts(Messages.findUnreadMessagesByRoomAndDate(roomId, userLastSeen), roomId, userId);
		}

		updateMessages(roomId);
	},

	markMessageAsReadBySender(message, roomId, userId) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		// this will usually happens if the message sender is the only one on the room
		const firstSubscription = Subscriptions.getMinimumLastSeenByRoomId(roomId);
		if (message.unread && message.ts < firstSubscription.ls) {
			Messages.setAsReadById(message._id, firstSubscription.ls);
		}

		this.storeReadReceipts([{ _id: message._id }], roomId, userId);
	},

	storeReadReceipts(messages, roomId, userId) {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const receipts = messages.map((message) => ({
				_id: Random.id(),
				roomId,
				userId,
				messageId: message._id,
				ts,
			}));

			if (receipts.length === 0) {
				return;
			}

			try {
				rawReadReceipts.insertMany(receipts);
			} catch (e) {
				console.error('Error inserting read receipts per user');
			}
		}
	},

	getReceipts(message) {
		return ReadReceipts.findByMessageId(message._id).map((receipt) => ({
			...receipt,
			user: Users.findOneById(receipt.userId, { fields: { username: 1, name: 1 } }),
		}));
	},
};
