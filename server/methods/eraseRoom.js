Meteor.methods({
	eraseRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'eraseRoom'
			});
		}

		const fromId = Meteor.userId();
		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'eraseRoom'
			});
		}

		if (RocketChat.authz.hasPermission(fromId, `delete-${ room.t }`, rid)) {

			const subGroups = RocketChat.models.Rooms.find({'originalRoomId': room.rid}).fetch();
			if (subGroups.length) {
				subGroups.forEach(subgroup => {
					RocketChat.models.Messages.removeByRoomId(subgroup._id);
					RocketChat.models.Subscriptions.removeByRoomId(subgroup._id);
					RocketChat.models.Rooms.removeById(subgroup._id);
				});
			}

			RocketChat.models.Messages.removeByRoomId(rid);
			RocketChat.models.Subscriptions.removeByRoomId(rid);
			return RocketChat.models.Rooms.removeById(rid);
		} else {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'eraseRoom'
			});
		}
	}
});
