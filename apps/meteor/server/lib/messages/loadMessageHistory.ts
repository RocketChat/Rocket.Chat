import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { getHiddenSystemMessages } from '../../../app/lib/server/lib/getHiddenSystemMessages';
import { settings } from '../../../app/settings/server/cached';
import { normalizeMessagesForUser } from '../../../app/utils/server/lib/normalizeMessagesForUser';

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

	const firstMessage = records[records.length - 1];
	const lastSeen = ls ? new Date(ls) : undefined;
	const hasValidLastSeen = lastSeen !== undefined && !Number.isNaN(lastSeen.getTime());

	const computeUnread = async (): Promise<{ firstUnread: IMessage | undefined; unreadNotLoaded: number }> => {
		if (!hasValidLastSeen || !lastSeen || !firstMessage || !(new Date(firstMessage.ts) > lastSeen)) {
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
			Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				lastSeen,
				firstMessage.ts,
				hiddenMessageTypes,
				showThreadMessages,
			),
		]);

		return { firstUnread: firstUnreadRecords[0], unreadNotLoaded };
	};

	const [messages, unread] = await Promise.all([normalizeMessagesForUser(records, userId), computeUnread()]);

	return {
		messages,
		firstUnread: unread.firstUnread,
		unreadNotLoaded: unread.unreadNotLoaded,
	};
}
