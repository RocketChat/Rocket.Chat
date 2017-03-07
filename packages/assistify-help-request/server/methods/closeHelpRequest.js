Meteor.methods({
	'assistify:closeHelpRequest'(helpRequestId, closingProps={}) {
		if(helpRequestId) {
			RocketChat.models.HelpRequests.close(helpRequestId, closingProps);

			// delete subscriptions in order to make the room disappear from the user's clients
			const helpRequest = RocketChat.models.HelpRequests.findOneById(helpRequestId);
			RocketChat.models.Subscriptions.removeByRoomId(helpRequest.roomId)
		}
	}
});
