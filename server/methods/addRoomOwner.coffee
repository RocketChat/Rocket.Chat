Meteor.methods
	addRoomOwner: (rid, userId) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] addRoomOwner -> Invalid user'

		check rid, String
		check userId, String

		unless RocketChat.authz.hasPermission Meteor.userId(), 'set-owner', rid
			throw new Meteor.Error 403, 'Not allowed'

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, userId
		unless subscription?
			throw new Meteor.Error 'invalid-subscription', '[methods] addRoomOwner -> Invalid Subscription'

		RocketChat.models.Subscriptions.addRoleById(subscription._id, 'owner')

		user = RocketChat.models.Users.findOneById userId
		fromUser = RocketChat.models.Users.findOneById Meteor.userId()
		RocketChat.models.Messages.createNewOwnerWithRoomIdAndUser rid, user,
			u:
				_id: fromUser._id
				username: fromUser.username

		return true
