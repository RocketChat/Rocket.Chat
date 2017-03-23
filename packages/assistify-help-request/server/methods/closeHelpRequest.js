Meteor.methods({
	'assistify:closeHelpRequest'(roomId, closingProps={}) {
		const room = RocketChat.models.Rooms.findOneByIdOrName(roomId);
		if(room.helpRequestId) {
			RocketChat.models.HelpRequests.close(room.helpRequestId, closingProps);

			// delete subscriptions in order to make the room disappear from the user's clients
			const nonOwners = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, room.u._id).fetch();
			nonOwners.forEach((nonOwner)=>{
				RocketChat.models.Subscriptions.removeByRoomIdAndUserId(roomId,nonOwner.u._id);
			});

			Meteor.defer(() => {
				RocketChat.callbacks.run('assistify.closeRoom', room, closingProps);
			});
		}
	}
});
