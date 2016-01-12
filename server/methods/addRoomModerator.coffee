Meteor.methods
	addRoomModerator: (rid, userId) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] addRoomModerator -> Invalid user'

		check rid, String
		check userId, String

		unless RocketChat.authz.hasPermission Meteor.userId(), 'set-moderator', rid
			throw new Meteor.Error 403, 'Not allowed'

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, userId
		unless subscription?
			throw new Meteor.Error 'invalid-subscription', '[methods] addRoomModerator -> Invalid Subscription'

		RocketChat.models.Subscriptions.addRoleById(subscription._id, 'moderator')

		user = RocketChat.models.Users.findOneById userId
		fromUser = RocketChat.models.Users.findOneById Meteor.userId()
		RocketChat.models.Messages.createNewModeratorWithRoomIdAndUser rid, user,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
