import { composeMessageObjectWithUser } from 'meteor/rocketchat:utils';
import { API } from '../api';

API.helperMethods.set('composeRoomWithLastMessage', function _composeRoomWithLastMessage(room, userId) {
	if (room.lastMessage) {
		room.lastMessage = composeMessageObjectWithUser(room.lastMessage, userId);
	}
	return room;
});
