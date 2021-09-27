import { API } from '../api';

API.helperMethods.set('composeRoomWithLastMessage', function _composeRoomWithLastMessage(room, userId) {
	const { normalizeMessagesForUser } = Promise.await(import('../../../utils/server/lib/normalizeMessagesForUser'));
	if (room.lastMessage) {
		const [lastMessage] = normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}
	return room;
});
