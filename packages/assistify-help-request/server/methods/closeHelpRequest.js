Meteor.methods({
	'assistify:closeHelpRequest'(roomId, closingProps={}) {
		const room = RocketChat.models.Rooms.findOneByIdOrName(roomId);
		if (room.helpRequestId) {
			RocketChat.models.HelpRequests.close(room.helpRequestId, closingProps);
			const user = Meteor.user();
			const now = new Date();
			RocketChat.models.Rooms.closeByRoomId(room._id, {
				user: {
					_id: user._id,
					username: user.username
				},
				closedAt: now,
				chatDuration: (now.getTime() - room.ts) / 1000
			});
			// delete subscriptions in order to make the room disappear from the user's clients
			const nonOwners = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, room.u._id).fetch();
			nonOwners.forEach((nonOwner)=>{
				RocketChat.models.Subscriptions.removeByRoomIdAndUserId(roomId, nonOwner.u._id);
			});

			Meteor.defer(() => {
				RocketChat.callbacks.run('assistify.closeRoom', room, closingProps);
			});
		}
	}
});
