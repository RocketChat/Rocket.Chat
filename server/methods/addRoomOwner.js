Meteor.methods({
	addRoomOwner(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomOwner'
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-owner', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomOwner'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomOwner'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomOwner'
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('owner') === true) {
			throw new Meteor.Error('error-user-already-owner', 'User is already an owner', {
				method: 'addRoomOwner'
			});
		}

		RocketChat.models.Subscriptions.addRoleById(subscription._id, 'owner');

		const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());

		RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			},
			role: 'owner'
		});

		if (RocketChat.settings.get('UI_DisplayRoles')) {
			RocketChat.Notifications.notifyLogged('roles-change', {
				type: 'added',
				_id: 'owner',
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
