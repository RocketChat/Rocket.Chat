Meteor.methods
	addRoomModerator: (rid, userId) ->

		check rid, String
		check userId, String

		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addRoomModerator' }

		unless RocketChat.authz.hasPermission Meteor.userId(), 'set-moderator', rid
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addRoomModerator' }

		user = RocketChat.models.Users.findOneById userId

		unless user?.username
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addRoomModerator' }

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, user._id
		unless subscription?
			throw new Meteor.Error 'error-user-not-in-room', 'User is not in this room', { method: 'addRoomModerator' }

		if 'moderator' in (subscription.roles or [])
			throw new Meteor.Error 'error-user-already-moderator', 'User is already a moderator', { method: 'addRoomModerator' }

		RocketChat.models.Subscriptions.addRoleById(subscription._id, 'moderator')

		fromUser = RocketChat.models.Users.findOneById Meteor.userId()
		RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser rid, user,
			u:
				_id: fromUser._id
				username: fromUser.username
			role: 'moderator'

		if RocketChat.settings.get('UI_DisplayRoles')
			RocketChat.Notifications.notifyLogged('roles-change', { type: 'added', _id: 'moderator', u: { _id: user._id, username: user.username }, scope: rid });

		return true
