Meteor.methods({
	'assistify:helpRequestByRoomId'(roomId) {
		if (roomId) {
			if (!Meteor.userId()) {
				throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
			}
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(roomId);
			if (helpRequest) {

				// the user is authorized to retrieve the help requests
				const room = RocketChat.models.Rooms.findOneById(helpRequest.roomId, {
					fields: {
						helpRequestId: 1,
						usernames: 1
					}
				});
				if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-r-room')) {
					throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
				}

				return helpRequest;
			}
		}
	}
});
