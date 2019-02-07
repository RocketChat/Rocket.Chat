import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.helperMethods.set('composeRoomWithLastMessage', function _composeRoomWithLastMessage(room, userId) {
	if (room.lastMessage) {
		room.lastMessage = RocketChat.composeMessageObjectWithUser(room.lastMessage, userId);
	}
	return room;
});
