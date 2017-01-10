Meteor.methods
	addRoomOwner: (rid, userId) ->

		check rid, String
		check userId, String

		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addRoomOwner' }

		unless RocketChat.authz.hasPermission Meteor.userId(), 'set-owner', rid
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addRoomOwner' }

		user = RocketChat.models.Users.findOneById userId

		unless user?.username
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addRoomOwner' }

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, user._id
		unless subscription?
			throw new Meteor.Error 'error-user-not-in-room', 'User is not in this room', { method: 'addRoomOwner' }

		if 'owner' in (subscription.roles or [])
			throw new Meteor.Error 'error-user-already-owner', 'User is already an owner', { method: 'addRoomOwner' }

		RocketChat.models.Subscriptions.addRoleById(subscription._id, 'owner')

		fromUser = RocketChat.models.Users.findOneById Meteor.userId()
		RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser rid, user,
			u:
				_id: fromUser._id
				username: fromUser.username
			role: 'owner'

		if RocketChat.settings.get('UI_DisplayRoles')
			RocketChat.Notifications.notifyAll('roles-change', { type: 'added', _id: 'owner', u: { _id: user._id, username: user.username }, scope: rid });

		return true
