Meteor.methods({
	'assistify:closeHelpRequest'(roomId, closingProps={}) {
		const room = RocketChat.models.Rooms.findOneByIdOrName(roomId);
		if(room.helpRequestId) {
			RocketChat.models.HelpRequests.close(room.helpRequestId, closingProps);

			// delete subscriptions in order to make the room disappear from the user's clients
			RocketChat.models.Subscriptions.removeByRoomId(roomId)
		}
	}
});
