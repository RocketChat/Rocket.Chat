import { settings } from '../../../settings';
import { Messages } from '../../../models';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';

const hideMessagesOfType = new Set();

settings.get('Hide_System_Messages', function(key, values) {
	const hiddenTypes = values.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
	hideMessagesOfType.clear();
	hiddenTypes.forEach((item) => hideMessagesOfType.add(item));
});

export const loadMessageHistory = function loadMessageHistory({ userId, rid, end, limit = 20, ls }) {
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

	const records = end != null ? Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, Array.from(hideMessagesOfType.values()), options).fetch() : Messages.findVisibleByRoomIdNotContainingTypes(rid, Array.from(hideMessagesOfType.values()), options).fetch();
	const messages = normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;

			const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, ls, firstMessage.ts, Array.from(hideMessagesOfType.values()), {
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
