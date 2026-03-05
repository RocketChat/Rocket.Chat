import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IReadReceipt, IReadReceiptWithUser } from '@rocket.chat/core-typings';
import { ReadReceipts, ReadReceiptsArchive, Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../../app/settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

// debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once
const list: Record<string, NodeJS.Timeout> = {};
const debounceByRoomId = function (fn: (room: IRoom) => Promise<void>) {
	return function (this: unknown, room: IRoom) {
		clearTimeout(list[room._id]);
		list[room._id] = setTimeout(() => {
			void fn.call(this, room);
			delete list[room._id];
		}, 2000);
	};
};

const updateMessages = debounceByRoomId(async ({ _id, lm }: IRoom) => {
	// @TODO maybe store firstSubscription in room object so we don't need to call the above update method
	const firstSubscription = await Subscriptions.getMinimumLastSeenByRoomId(_id);
	if (!firstSubscription?.ls) {
		return;
	}

	const result = await Messages.setVisibleMessagesAsRead(_id, firstSubscription.ls);
	if (result.modifiedCount > 0) {
		void api.broadcast('notify.messagesRead', { rid: _id, until: firstSubscription.ls });
	}

	if (lm && lm <= firstSubscription.ls) {
		await Rooms.setLastMessageAsRead(_id);
		void notifyOnRoomChangedById(_id);
	}
});

class ReadReceiptClass {
	async markMessagesAsRead(roomId: string, userId: string, userLastSeen: Date) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const room = await Rooms.findOneById(roomId, { projection: { lm: 1 } });

		// if users last seen is greater than room's last message, it means the user already have this room marked as read
		if (!room || (room.lm && userLastSeen > room.lm)) {
			return;
		}

		void this.storeReadReceipts(
			() => {
				return Messages.findVisibleUnreadMessagesByRoomAndDate(roomId, userLastSeen).toArray();
			},
			roomId,
			userId,
		);

		updateMessages(room);
	}

	async markMessageAsReadBySender(message: IMessage, { _id: roomId }: { _id: string }, userId: string) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		if (!message.unread) {
			return;
		}

		// mark message as read if the sender is the only one in the room
		const isUserAlone = (await Subscriptions.countByRoomIdAndNotUserId(roomId, userId)) === 0;
		if (isUserAlone) {
			const result = await Messages.setAsReadById(message._id);
			if (result.modifiedCount > 0) {
				void notifyOnMessageChange({
					id: message._id,
				});
			}
		}

		void this.storeReadReceipts(
			() => {
				return Promise.resolve([message]);
			},
			roomId,
			userId,
		);
	}

	async storeThreadMessagesReadReceipts(tmid: string, userId: string, userLastSeen: Date) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const message = await Messages.findOneById(tmid, { projection: { tlm: 1, rid: 1 } });

		// if users last seen is greater than thread's last message, it means the user has already marked this thread as read
		if (!message || (message.tlm && userLastSeen > message.tlm)) {
			return;
		}

		void this.storeReadReceipts(
			() => {
				return Messages.findUnreadThreadMessagesByDate(message.rid, tmid, userId, userLastSeen).toArray();
			},
			message.rid,
			userId,
		);
	}

	private async storeReadReceipts(
		getMessages: () => Promise<Pick<IMessage, '_id' | 't' | 'pinned' | 'drid' | 'tmid'>[]>,
		roomId: string,
		userId: string,
	) {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const receipts = (await getMessages()).map((message) => ({
				_id: message._id + userId,
				roomId,
				userId,
				messageId: message._id,
				ts,
			}));

			if (receipts.length === 0) {
				return;
			}

			try {
				await ReadReceipts.insertMany(receipts);
			} catch (err) {
				SystemLogger.error({ msg: 'Error inserting read receipts per user', err });
			}
		}
	}

	async getReceipts(message: Pick<IMessage, '_id' | 'receiptsArchived'>): Promise<IReadReceiptWithUser[]> {
		// Query hot storage (always)
		const hotReceipts = await ReadReceipts.findByMessageId(message._id).toArray();

		// Query cold storage only if message has archived receipts
		let coldReceipts: IReadReceipt[] = [];
		if (message.receiptsArchived) {
			coldReceipts = await ReadReceiptsArchive.findByMessageId(message._id).toArray();
		}

		// Combine receipts from both storages
		const receipts = [...hotReceipts, ...coldReceipts];

		// get unique receipts user ids
		const userIds = [...new Set(receipts.map((receipt) => receipt.userId))];

		// get users for the receipts
		const users = await Users.findByIds(userIds, { projection: { username: 1, name: 1 } }).toArray();
		const usersMap = new Map(users.map((user) => [user._id, user]));

		return Promise.all(
			receipts.map(async (receipt) => ({
				...receipt,
				user: usersMap.get(receipt.userId) as IReadReceiptWithUser['user'],
			})),
		);
	}
}

export const ReadReceipt = new ReadReceiptClass();
