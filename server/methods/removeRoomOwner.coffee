Meteor.methods
	removeRoomOwner: (rid, userId) ->

		check rid, String
		check userId, String

		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'removeRoomOwner' }

		unless RocketChat.authz.hasPermission Meteor.userId(), 'set-owner', rid
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'removeRoomOwner' }

		user = RocketChat.models.Users.findOneById userId

		unless user?.username
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'removeRoomOwner' }

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, user._id
		unless subscription?
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'removeRoomOwner' }

		if 'owner' not in (subscription.roles or [])
			throw new Meteor.Error 'error-user-not-owner', 'User is not an owner', { method: 'removeRoomOwner' }

		numOwners = RocketChat.authz.getUsersInRole('owner', rid).count()
		if numOwners is 1
			throw new Meteor.Error 'error-remove-last-owner', 'This is the last owner. Please set a new owner before removing this one.', { method: 'removeRoomOwner' }

		RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'owner')

		fromUser = RocketChat.models.Users.findOneById Meteor.userId()
		RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser rid, user,
			u:
				_id: fromUser._id
				username: fromUser.username
			role: 'owner'

		if RocketChat.settings.get('UI_DisplayRoles')
			RocketChat.Notifications.notifyAll('roles-change', { type: 'removed', _id: 'owner', u: { _id: user._id, username: user.username }, scope: rid });

		return true
