Meteor.publish('livechat:externalMessages', function(roomId) {
	return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
