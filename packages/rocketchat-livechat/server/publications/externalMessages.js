import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.publish('livechat:externalMessages', function(roomId) {
	return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
