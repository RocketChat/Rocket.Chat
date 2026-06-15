import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { settings } from '../../../settings/server/cached';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getHiddenSystemMessages } from '../lib/getHiddenSystemMessages';

export async function loadMessageHistory({
	userId,
	rid,
	end,
	limit = 20,
	ls,
	showThreadMessages = true,
	offset = 0,
	room: providedRoom,
}: {
	// userId is undefined if user is reading anonymously
	userId?: string;
	rid: string;
	end: Date | undefined;
	limit?: number;
	ls?: string | Date;
	showThreadMessages?: boolean;
	offset?: number;
	// Pass a pre-fetched room (must include `sysMes`) to skip the duplicate Rooms.findOneById that
	// the caller already performed (e.g. the loadHistory method fetches the room for access checks).
	room?: IRoom;
}) {
	const room = providedRoom ?? (await Rooms.findOneById(rid, { projection: { sysMes: 1 } }));

	if (!room) {
		throw new Error('error-invalid-room');
	}

	const hiddenSystemMessages = settings.get<MessageTypesValues[]>('Hide_System_Messages');

	const hiddenMessageTypes = getHiddenSystemMessages(room, hiddenSystemMessages);

	const options: FindOptions<IMessage> = {
		sort: {
			ts: -1,
		},
		limit,
		skip: offset,
	};

	const records = end
		? await Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
				rid,
				end,
				hiddenMessageTypes,
				options,
				showThreadMessages,
			).toArray()
		: await Messages.findVisibleByRoomIdNotContainingTypes(rid, hiddenMessageTypes, options, showThreadMessages).toArray();

	// `records` is sorted ts desc, so the oldest message in the batch is the last element. Unread
	// math only needs its timestamp, so it can run off `records` independently of normalization.
	const firstMessage = records[records.length - 1];
	const lastSeen = ls ? new Date(ls) : undefined;

	const computeUnread = async (): Promise<{ firstUnread: IMessage | undefined; unreadNotLoaded: number }> => {
		if (!lastSeen || !firstMessage || new Date(firstMessage.ts) <= lastSeen) {
			return { firstUnread: undefined, unreadNotLoaded: 0 };
		}

		const [firstUnreadRecords, unreadNotLoaded] = await Promise.all([
			Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				lastSeen,
				firstMessage.ts,
				hiddenMessageTypes,
				{ limit: 1, sort: { ts: 1 } },
				showThreadMessages,
			).toArray(),
			Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, lastSeen, firstMessage.ts, hiddenMessageTypes, showThreadMessages),
		]);

		return { firstUnread: firstUnreadRecords[0], unreadNotLoaded };
	};

	// Normalization (a Users lookup) and the unread queries are independent — run them concurrently
	// instead of waiting for normalization before issuing the unread find + count.
	const [messages, unread] = await Promise.all([normalizeMessagesForUser(records, userId), computeUnread()]);

	return {
		messages,
		firstUnread: unread.firstUnread,
		unreadNotLoaded: unread.unreadNotLoaded,
	};
}
