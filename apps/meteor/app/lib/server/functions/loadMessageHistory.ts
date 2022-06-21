/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { settings } from '../../../settings/server';
import { Messages, Rooms } from '../../../models/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getHiddenSystemMessages } from '../lib/getHiddenSystemMessages';

export const loadMessageHistory = function loadMessageHistory({
	userId,
	rid,
	end,
	limit = 20,
	ls,
	showThreadMessages = true,
}: {
	userId: string;
	rid: string;
	end: string;
	limit: number;
	ls: string;
	showThreadMessages: boolean;
}) {
	const room = Rooms.findOneById(rid, { fields: { sysMes: 1 } });

	const hiddenMessageTypes = getHiddenSystemMessages(room);

	const options = {
		sort: {
			ts: -1,
		},
		limit,
		fields: {},
	};

	if (!settings.get('Message_ShowEditedStatus')) {
		options.fields = {
			editedAt: 0,
		};
	}

	const records =
		end != null
			? Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, hiddenMessageTypes, options, showThreadMessages).fetch()
			: Messages.findVisibleByRoomIdNotContainingTypes(rid, hiddenMessageTypes, options, showThreadMessages).fetch();
	const messages = normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			// delete options.limit;
			const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				ls,
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

			firstUnread = unreadMessages.fetch()[0];
			unreadNotLoaded = unreadMessages.count();
		}
	}

	return {
		messages,
		firstUnread,
		unreadNotLoaded,
	};
};
