import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Messages.createRoomArchivedByRoomIdAndUser = function(roomId, user) {
	return this.createWithTypeRoomIdMessageAndUser('room-archived', roomId, '', user);
};
