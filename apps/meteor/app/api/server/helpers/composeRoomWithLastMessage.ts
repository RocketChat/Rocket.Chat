import type { IRoom } from '@rocket.chat/core-typings';

import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';

API.helperMethods.set('composeRoomWithLastMessage', function _composeRoomWithLastMessage(room: IRoom, userId: string) {
	if (room.lastMessage) {
		const [lastMessage] = normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}
	return room;
});
