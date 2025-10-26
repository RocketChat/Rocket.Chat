import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IReadReceipt, IReadReceiptWithUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, ReadReceipts, Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../../app/settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

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

	async markMessageAsReadBySender(message: IMessage, { _id: roomId, t }: { _id: string; t: string }, userId: string) {
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

		const extraData = roomCoordinator.getRoomDirectives(t).getReadReceiptsExtraData(message);
		void this.storeReadReceipts(
			() => {
				return Promise.resolve([message]);
			},
			roomId,
			userId,
			extraData,
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
		extraData: Partial<IReadReceipt> = {},
	) {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const receipts = (await getMessages()).map((message) => ({
				_id: Random.id(),
				roomId,
				userId,
				messageId: message._id,
				ts,
				...(message.t && { t: message.t }),
				...(message.pinned && { pinned: true }),
				...(message.drid && { drid: message.drid }),
				...(message.tmid && { tmid: message.tmid }),
				...extraData,
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

	async getReceipts(message: Pick<IMessage, '_id'>): Promise<IReadReceiptWithUser[]> {
		const receipts = await ReadReceipts.findByMessageId(message._id).toArray();

		return Promise.all(
			receipts.map(async (receipt) => ({
				...receipt,
				user: (receipt.token
					? await LivechatVisitors.getVisitorByToken(receipt.token, { projection: { username: 1, name: 1 } })
					: await Users.findOneById(receipt.userId, { projection: { username: 1, name: 1, token: 1 } })) as IReadReceiptWithUser['user'],
			})),
		);
	}
}

export const ReadReceipt = new ReadReceiptClass();
