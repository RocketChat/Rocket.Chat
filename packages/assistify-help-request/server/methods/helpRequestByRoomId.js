Meteor.methods({
	'assistify:helpRequestByRoomId'(roomId) {
		if(roomId) {
			return RocketChat.models.HelpRequests.findOneByRoomId(roomId)
		}
	}
});
