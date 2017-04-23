Meteor.methods({
	'assistify:helpRequestByRoomId'(roomId) {
		if (roomId) {
			if (!Meteor.userId()) {
				throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
			}
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(roomId);
			if (helpRequest) {

				// the user is authorized to retrieve the help request if he's a member of the room
				//todo: Re-enable once proper authorizations are implemented
				// const room = RocketChat.models.Rooms.findOneById(helpRequest.roomId, {
				// 	fields: {
				// 		helpRequestId: 1,
				// 		usernames: 1
				// 	}
				// });
				// const user = RocketChat.models.Users.findOne({_id: Meteor.userId()});
				// if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-r-rooms') && !(room.usernames.indexOf(user.username) > -1)) {
				// 	throw new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'});
				// }

				return helpRequest;
			}
		}
	}
});
