import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.setReactionsInLastMessage = function(roomId, lastMessage) {
	return this.update({ _id: roomId }, { $set: { lastMessage } });
};

RocketChat.models.Rooms.unsetReactionsInLastMessage = function(roomId) {
	return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
};
