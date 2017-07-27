Meteor.methods({
	removeRoomLeader(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomLeader'
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-leader', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomLeader'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomLeader'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeRoomLeader'
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === false) {
			throw new Meteor.Error('error-user-not-leader', 'User is not a leader', {
				method: 'removeRoomLeader'
			});
		}

		RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'leader');

		const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());

		RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			},
			role: 'leader'
		});

		if (RocketChat.settings.get('UI_DisplayRoles')) {
			RocketChat.Notifications.notifyLogged('roles-change', {
				type: 'removed',
				_id: 'leader',
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
