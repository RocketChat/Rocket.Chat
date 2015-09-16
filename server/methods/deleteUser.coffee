Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteUser -> Invalid user")

		user = RocketChat.models.Users.findOneById Meteor.userId()

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') is true
			throw new Meteor.Error 'not-authorized', '[methods] deleteUser -> Not authorized'

		user = RocketChat.models.Users.findOneById userId
		unless user?
			throw new Meteor.Error 'not-found', '[methods] deleteUser -> User not found'

		ChatMessage.remove { "u._id": userId } # Remove user messages

		RocketChat.models.Subscriptions.findByUserId(userId).forEach (subscription) ->
			room = ChatRoom.findOne subscription.rid
			if room.t isnt 'c' and room.usernames.length is 1
				ChatRoom.remove subscription.rid # Remove non-channel rooms with only 1 user (the one being deleted)



		RocketChat.models.Subscriptions.removeByUserId userId # Remove user subscriptions

		rooms = ChatRoom.find({ "u._id": userId }).fetch()


		ChatRoom.remove { t: 'd', usernames: user.username } # Remove direct rooms with the user
		ChatRoom.update {}, { $pull: { usernames: user.username } }, { multi: true } # Remove user from all other rooms
		RocketChat.models.Users.removeById userId # Remove user from users database

		return true
