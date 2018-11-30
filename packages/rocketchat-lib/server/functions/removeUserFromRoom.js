import { Meteor } from 'meteor/meteor';

RocketChat.removeUserFromRoom = function(rid, user) {
	const room = RocketChat.models.Rooms.findOneById(rid);

	if (room) {
		RocketChat.callbacks.run('beforeLeaveRoom', user, room);

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id, { fields: { _id: 1 } });

		if (subscription) {
			const removedUser = user;
			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rid, removedUser);
		}

		if (room.t === 'l') {
			RocketChat.models.Messages.createCommandWithRoomIdAndUser('survey', rid, user);
		}

		RocketChat.models.Subscriptions.removeByRoomIdAndUserId(rid, user._id);

		Meteor.defer(function() {
			// TODO: CACHE: maybe a queue?
			RocketChat.callbacks.run('afterLeaveRoom', user, room);
		});
	}
};
