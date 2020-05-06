import { settings } from '../../../settings';
import { Messages, Rooms } from '../../../models';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';

const hideMessagesOfTypeServer = new Set();

settings.get('Hide_System_Messages', function(key, values) {
	const hiddenTypes = values.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
	hideMessagesOfTypeServer.clear();
	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

export const loadClosingMessage = function loadClosingMessage({ userId, rid, limit = 20 }) {
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

	const records = Messages.findVisibleByRoomIdWithClosingMessages(rid, hiddenMessageTypes, options).fetch();
	const messages = normalizeMessagesForUser(records, userId);
	return {
		messages,
	};
};
