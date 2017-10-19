Meteor.methods({
	'assistify:helpRequestByRoomId'(roomId) {
		if (roomId) {
			if (!Meteor.userId()) {
				throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
			}
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(roomId);
			if (helpRequest) {

				if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-r-room')) {
					throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
				}

				return helpRequest;
			}
		}
	}
});
