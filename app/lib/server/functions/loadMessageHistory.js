import { settings } from '../../../settings/server';
import { Rooms } from '../../../models/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { Message } from '../../../../server/sdk';

const hideMessagesOfTypeServer = new Set();

settings.get('Hide_System_Messages', function(key, values) {
	const hiddenTypes = values.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
	hideMessagesOfTypeServer.clear();
	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

export function loadMessageHistory({ userId, rid, end, limit = 20, ls }) {
	const room = Rooms.findOne(rid, { fields: { sysMes: 1, hideHistoryForNewMembers: 1 } });

	// TODO probably remove on chained event system
	const hiddenMessageTypes = Array.isArray(room && room.sysMes)
		? room.sysMes
		: Array.from(hideMessagesOfTypeServer.values());

	const options = {
		sort: {
			ts: -1,
		},
		limit,
	};

	if (!settings.get('Message_ShowEditedStatus')) {
		options.fields = {
			editedAt: 0,
		};
	}

	const { records } = Promise.await(Message.get(userId, { rid, excludeTypes: hiddenMessageTypes, oldest: end, queryOptions: options }));

	const messages = normalizeMessagesForUser(records, userId);

	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;
			const { records: unreadMessages, total } = Promise.await(Message.get(userId, {
				rid,
				excludeTypes: hiddenMessageTypes,
				latest: ls,
				oldest: firstMessage.ts,
				queryOptions: {
					limit: 1,
					sort: {
						ts: 1,
					},
				},
			}));

			firstUnread = unreadMessages[0];
			unreadNotLoaded = total;
		}
	}

	return {
		messages,
		firstUnread,
		unreadNotLoaded,
	};
}
