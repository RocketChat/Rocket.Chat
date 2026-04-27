import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IReadReceipt, IReadReceiptWithUser, IOmnichannelRoom, AtLeast, IUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, ReadReceipts, ReadReceiptsArchive, Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../../app/settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

type RoomWithTypeAndVisitor = Pick<IRoom, '_id' | 't'> & { v?: IOmnichannelRoom['v'] };

// debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once
const list: Record<string, NodeJS.Timeout> = {};
const debounceByRoomId = function <TRoom extends Pick<IRoom, '_id'>>(fn: (room: TRoom) => Promise<void>) {
	return function (this: unknown, room: TRoom) {
		clearTimeout(list[room._id]);
		list[room._id] = setTimeout(() => {
			void fn.call(this, room);
			delete list[room._id];
		}, 2000);
	};
};

const updateMessages = debounceByRoomId(async ({ _id, lm }: AtLeast<IRoom, '_id' | 'lm'>) => {
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

		const room: (RoomWithTypeAndVisitor & Pick<IRoom, 'lm'>) | null = await Rooms.findOneById(roomId, {
			projection: { lm: 1, t: 1, v: 1 },
		});

		// if users last seen is greater than room's last message, it means the user already have this room marked as read
		if (!room || (room.lm && userLastSeen > room.lm)) {
			return;
		}

		void this.storeReadReceipts(
			() => {
				return Messages.findVisibleUnreadMessagesByRoomAndDate(roomId, userLastSeen).toArray();
			},
			room,
			userId,
		);

		updateMessages(room);
	}

	async markMessageAsReadBySender(message: IMessage, room: RoomWithTypeAndVisitor, userId: string) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		if (!message.unread) {
			return;
		}

		// mark message as read if the sender is the only one in the room
		const isUserAlone = (await Subscriptions.countUnarchivedByRoomIdAndNotUserId(room._id, userId)) === 0;
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
			room,
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

		const room: RoomWithTypeAndVisitor | null = await Rooms.findOneById(message.rid, { projection: { t: 1, v: 1 } });

		if (!room) {
			return;
		}

		void this.storeReadReceipts(
			() => {
				return Messages.findUnreadThreadMessagesByDate(message.rid, tmid, userId, userLastSeen).toArray();
			},
			room,
			userId,
		);
	}

	private isLivechatVisitor(room: RoomWithTypeAndVisitor | null | undefined, userId: string): boolean {
		return room?.t === 'l' && room.v?._id === userId;
	}

	private async storeReadReceipts(
		getMessages: () => Promise<Pick<IMessage, '_id' | 't' | 'pinned' | 'drid' | 'tmid'>[]>,
		room: RoomWithTypeAndVisitor,
		userId: string,
	) {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const isVisitor = this.isLivechatVisitor(room, userId);

			const receipts: IReadReceipt[] = (await getMessages()).map((message) => ({
				_id: message._id + userId,
				roomId: room._id,
				userId,
				messageId: message._id,
				ts,
				...(isVisitor && { isVisitor: true }),
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
		const receipts = [...new Map([...hotReceipts, ...coldReceipts].map((receipt) => [receipt._id, receipt])).values()];

		// get unique receipts user ids
		const userIds = [...new Set(receipts.filter((receipt) => !receipt.isVisitor).map((receipt) => receipt.userId))];
		const visitorIds = [...new Set(receipts.filter((receipt) => receipt.isVisitor).map((receipt) => receipt.userId))];

		const projection = { projection: { username: 1, name: 1 } } as const;

		const [users, visitors] = await Promise.all([
			userIds.length ? Users.findByIds(userIds, projection).toArray() : [],
			visitorIds.length ? LivechatVisitors.findByIds(visitorIds, projection).toArray() : [],
		]);

		const usersMap = new Map<string, Pick<IUser, '_id' | 'username' | 'name'>>(users.map((user) => [user._id, user]));
		for (const visitor of visitors) {
			usersMap.set(visitor._id, { _id: visitor._id, username: visitor.username, name: visitor.name });
		}

		return receipts.map((receipt) => ({
			...receipt,
			user: usersMap.get(receipt.userId),
		}));
	}
}

export const ReadReceipt = new ReadReceiptClass();
