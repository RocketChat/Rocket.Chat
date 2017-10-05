Meteor.methods({
	removeRoomOwner(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner'
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-owner', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomOwner'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);
		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'removeRoomOwner'
			});
		}

		if (Array.isArray(subscription.roles) === false || subscription.roles.includes('owner') === false) {
			throw new Meteor.Error('error-user-not-owner', 'User is not an owner', {
				method: 'removeRoomOwner'
			});
		}

		const numOwners = RocketChat.authz.getUsersInRole('owner', rid).count();

		if (numOwners === 1) {
			throw new Meteor.Error('error-remove-last-owner', 'This is the last owner. Please set a new owner before removing this one.', {
				method: 'removeRoomOwner'
			});
		}

		RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'owner');

		const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());

		RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			},
			role: 'owner'
		});

		if (RocketChat.settings.get('UI_DisplayRoles')) {
			RocketChat.Notifications.notifyLogged('roles-change', {
				type: 'removed',
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
