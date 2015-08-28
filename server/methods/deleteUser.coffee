Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteUser -> Invalid user")
		
		user = Meteor.users.findOne Meteor.userId()
		unless user?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] deleteUser -> Not authorized'

		user = Meteor.users.findOne userId
		unless user?
			throw new Meteor.Error 'not-found', '[methods] deleteUser -> User not found'

		ChatMessage.remove { "u._id": userId } # Remove user messages

		ChatSubscription.find({ "u._id": userId }).forEach (subscription) ->
			room = ChatRoom.findOne subscription.rid
			if room.t isnt 'c' and room.usernames.length is 1
				ChatRoom.remove subscription.rid # Remove non-channel rooms with only 1 user (the one being deleted)

			



		ChatSubscription.remove { "u._id": userId } # Remove user subscriptions

		rooms = ChatRoom.find({ "u._id": userId }).fetch()


		ChatRoom.remove { t: 'd', usernames: user.username } # Remove direct rooms with the user
		ChatRoom.update {}, { $pull: { usernames: user.username } }, { multi: true } # Remove user from all other rooms
		Meteor.users.remove { _id: userId } # Remove user from users database

		return true