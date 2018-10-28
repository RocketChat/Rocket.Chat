import { Meteor } from 'meteor/meteor';

RocketChat.removeUserFromRoom = function(rid, user, options = {}) {
	const room = RocketChat.models.Rooms.findOneById(rid);

	if (room) {
		RocketChat.callbacks.run('beforeLeaveRoom', user, room);

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id, { fields: { _id: 1 } });

		if (subscription) {
			if (options.byUser) {
				RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser(rid, user, {
					u: options.byUser,
				});
			} else {
				RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rid, user);
			}
		}

		if (room.t === 'l') {
			RocketChat.models.Messages.createCommandWithRoomIdAndUser('survey', rid, user);
		}

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId(rid, user._id);

		Meteor.defer(function() {
			RocketChat.callbacks.run('afterLeaveRoom', user, room);
		});
	}
};
