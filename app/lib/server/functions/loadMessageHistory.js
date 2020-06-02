import { settings } from '../../../settings';
import { Messages, Rooms } from '../../../models';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';

const hideMessagesOfTypeServer = new Set();

settings.get('Hide_System_Messages', function(key, values) {
	const hiddenTypes = values.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
	hideMessagesOfTypeServer.clear();
	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

export const loadMessageHistory = function loadMessageHistory({ userId, rid, end, limit = 20, ls }) {
	const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });

	const hiddenMessageTypes = Array.isArray(room && room.sysMes) ? room.sysMes : Array.from(hideMessagesOfTypeServer.values()); // TODO probably remove on chained event system
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

	const records = end != null ? Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, hiddenMessageTypes, options).fetch() : Messages.findVisibleByRoomIdNotContainingTypes(rid, hiddenMessageTypes, options).fetch();
	const messages = normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;
			const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, ls, firstMessage.ts, hiddenMessageTypes, {
				limit: 1,
				sort: {
					ts: 1,
				},
			});

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
