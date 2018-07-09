Meteor.startup(function() {
	RocketChat.roomTypes.setPublish('c', function(identifier) {
		const options = {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				topic: 1,
				announcement: 1,
				muted: 1,
				archived: 1,
				ro: 1,
				reactWhenReadOnly: 1,
				jitsiTimeout: 1,
				description: 1,
				sysMes: 1,
				joinCodeRequired: 1,
				streamingOptions: 1
			}
		};

		if (RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
			return RocketChat.models.Rooms.findByTypeAndName('c', identifier, options);
		} else if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room')) {
			const roomId = RocketChat.models.Subscriptions.findByTypeNameAndUserId('c', identifier, this.userId).fetch();
			if (roomId.length > 0) {
				return RocketChat.models.Rooms.findById(roomId[0].rid, options);
			}
		}

		return this.ready();
	});

	RocketChat.roomTypes.setPublish('p', function(identifier) {
		const options = {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				topic: 1,
				announcement: 1,
				muted: 1,
				archived: 1,
				ro: 1,
				reactWhenReadOnly: 1,
				jitsiTimeout: 1,
				description: 1,
				sysMes: 1,
				tokenpass: 1,
				streamingOptions: 1
			}
		};

		const user = RocketChat.models.Users.findOneById(this.userId, {
			fields: {
				username: 1
			}
		});

		return RocketChat.models.Rooms.findByTypeAndNameContainingUsername('p', identifier, user.username, options);
	});

	return RocketChat.roomTypes.setPublish('d', function(identifier) {
		const options = {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				topic: 1,
				jitsiTimeout: 1
			}
		};

		const user = RocketChat.models.Users.findOneById(this.userId, {
			fields: {
				username: 1
			}
		});

		if (RocketChat.authz.hasAtLeastOnePermission(this.userId, ['view-d-room', 'view-joined-room'])) {
			return RocketChat.models.Rooms.findByTypeContainingUsernames('d', [user.username, identifier], options);
		}

		return this.ready();
	});
});
