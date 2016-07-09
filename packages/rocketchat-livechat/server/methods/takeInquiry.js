Meteor.methods({
	'livechat:takeInquiry'(inquiry, agent) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:takeInquiry' });
		}

		if (RocketChat.models.LivechatInquiry.getStatus(inquiry._id) === 'taken') {
			throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', { method: 'livechat:takeInquiry' });
		}

		// add subscription
		var subscriptionData = {
			rid: inquiry.rid,
			name: inquiry.name,
			alert: true,
			open: true,
			unread: 1,
			code: inquiry.code,
			u: {
				_id: agent._id,
				username: agent.username
			},
			t: 'l',
			desktopNotifications: 'all',
			mobilePushNotifications: 'all',
			emailNotifications: 'all',
			answered: 'false'
		};
		RocketChat.models.Subscriptions.insert(subscriptionData);

		// add user to room
		RocketChat.models.Rooms.addUsernameById(inquiry.rid, agent.username);

		// mark inquiry as taken
		RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id);

		// return room corresponding to inquiry (for redirecting agent to the room route)
		return RocketChat.models.Rooms.findOneById(inquiry.rid);
	}
});
