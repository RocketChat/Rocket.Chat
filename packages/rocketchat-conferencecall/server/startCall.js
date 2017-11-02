Meteor.methods({
	'videoconference:startCall': (rid) => {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'videoconference:startCall' });
		}

		const user = Meteor.user();
		const roomId = Random.id();

		const room = {
			_id: roomId,
			msgs: 1,
			lm: new Date(),
			code: "roomCode",
			label: "test",
			// usernames: [agent.username, guest.username],
			t: 'v',
			ts: new Date(),
			v: {
				_id: user._id,
				username: user.username,
				//token: message.token
			},
			cl: false,
			open: true,
			waitingResponse: true
		};

		const subscriptionData = {
			rid: roomId,
			name: "test",
			alert: true,
			open: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			code: "roomCode",
			u: {
				_id: user._id,
				username: user.username
			},
			t: 'v',
			desktopNotifications: 'all',
			mobilePushNotifications: 'all',
			emailNotifications: 'all'
		};

		RocketChat.models.Rooms.insert(room);
		RocketChat.models.Subscriptions.insert(subscriptionData);
	}
});
