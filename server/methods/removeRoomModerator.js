Meteor.methods({
	removeRoomModerator(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomModerator'
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-moderator', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomModerator'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomModerator'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'removeRoomModerator'
			});
		}

		if (Array.isArray(subscription.roles) === false || subscription.roles.includes('moderator') === false) {
			throw new Meteor.Error('error-user-not-moderator', 'User is not a moderator', {
				method: 'removeRoomModerator'
			});
		}

		RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'moderator');

		const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());

		RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			},
			role: 'moderator'
		});

		if (RocketChat.settings.get('UI_DisplayRoles')) {
			RocketChat.Notifications.notifyLogged('roles-change', {
				type: 'removed',
				_id: 'moderator',
				u: {
					_id: user._id,
					username: user.username,
					name: user.name
				},
				scope: rid
			});
		}

		return true;
	}
});
