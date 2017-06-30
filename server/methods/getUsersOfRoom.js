Meteor.methods({
	getUsersOfRoom(roomId, showAll) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		const filter = (record) => {
			if (!record._user) {
				console.log('Subscription without user', record._id);
				return false;
			}

			if (showAll === true) {
				return true;
			}

			return record._user.status !== 'offline';
		};

		const map = (record) => {
			return {
				_id: record._user._id,
				username: record._user.username,
				name: record._user.name
			};
		};

		const records = RocketChat.models.Subscriptions.findByRoomId(roomId).fetch();

		return {
			total: records.length,
			records: records.filter(filter).map(map)
		};
	}
});
