import { normalizeMessagesForUser } from '../../../app/utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';

API.helperMethods.set('composeRoomWithLastMessage', function _composeRoomWithLastMessage(room, userId) {
	if (room.lastMessage) {
		const [lastMessage] = normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}
	return room;
});
