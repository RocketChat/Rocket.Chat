/* globals RocketChat, TAPi18n */

Meteor.methods({
	'assistify:closeHelpRequest'(roomId, closingProps = {}) {
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
			nonOwners.forEach((nonOwner) => {
				RocketChat.models.Subscriptions.hideByRoomIdAndUserId(roomId, nonOwner.u._id);
			});

			// remove the subscription of the user closing the room as well - if he's the one who triggered the closing
			if (Meteor.userId() === room.u._id) {
				RocketChat.models.Subscriptions.hideByRoomIdAndUserId(roomId, Meteor.userId());
			}

			// add a message informing about the closed state and the comment
			if (closingProps && closingProps.comment) {
				RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('request_closed', roomId, `: ${ closingProps.comment }`, user);
			} else {
				RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('request_closed', roomId, ` ${ closingProps.comment }`, user);
			}
			const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
			if (rocketCatUser) {
				RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('request_closed_explanation', roomId, '', rocketCatUser);
			}

			// trigger callback in order to send the conversation for learning to the knowledge adapter
			Meteor.defer(() => {
				RocketChat.callbacks.run('assistify.closeRoom', room, closingProps);
			});
		}
	}
});
