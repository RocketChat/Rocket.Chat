import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

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
}: {
	// userId is undefined if user is reading anonymously
	userId?: string;
	rid: string;
	end: Date | undefined;
	limit?: number;
	ls?: string | Date;
	showThreadMessages?: boolean;
	offset?: number;
}) {
	const room = await Rooms.findOneById(rid, { projection: { sysMes: 1 } });

	if (!room) {
		throw new Error('error-invalid-room');
	}

	const hiddenMessageTypes = getHiddenSystemMessages(room);

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
	const messages = await normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls) {
		const firstMessage = messages[messages.length - 1];

		const lastSeen = new Date(ls);

		if (firstMessage && new Date(firstMessage.ts) > lastSeen) {
			const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				lastSeen,
				firstMessage.ts,
				hiddenMessageTypes,
				{
					limit: 1,
					sort: {
						ts: 1,
					},
				},
				showThreadMessages,
			);

			const totalCursor = await Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				lastSeen,
				firstMessage.ts,
				hiddenMessageTypes,
				showThreadMessages,
			);

			firstUnread = (await unreadMessages.toArray())[0];
			unreadNotLoaded = totalCursor;
		}
	}

	return {
		messages,
		firstUnread,
		unreadNotLoaded,
	};
}
