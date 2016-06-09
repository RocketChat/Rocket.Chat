Meteor.methods({
	'livechat:takeInquiry'(inquiry, agent) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveDepartment' });
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
			answered: 'false',
		};
		RocketChat.models.Subscriptions.insert(subscriptionData);

		// add user to room
		RocketChat.models.Rooms.addUsernameById(inquiry.rid, agent.username);

		return RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id);
	}
});