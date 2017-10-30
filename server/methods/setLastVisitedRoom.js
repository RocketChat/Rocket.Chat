Meteor.methods({
	setLastVisitedRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameById'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		let lastVisitedRoom;

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setLastVisitedRoom'
			});
		}

		const user = Meteor.user();
		if (user && user.username && room.usernames.indexOf(user.username) !== -1) {
			const room_type_full_name = RocketChat.roomTypes.roomTypes[room.t].route.name;

			if (room.name) {
				lastVisitedRoom = `/${ room_type_full_name }/${ room.name }`;
			}

			if (!room.name && room.t === 'd') {
				const direct_message_to = room.usernames[1];
				lastVisitedRoom = `/${ room_type_full_name }/${ direct_message_to }`;
			}

			Meteor.users.update(user._id, { $set: { lastVisitedRoom } });
			return true;
		}
	}
});
