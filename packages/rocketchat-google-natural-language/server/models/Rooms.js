import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.models.Rooms.setSentiment = function(roomId, sentiment) {
	return this.update({ _id: roomId }, { $set: { sentiment } });
};
