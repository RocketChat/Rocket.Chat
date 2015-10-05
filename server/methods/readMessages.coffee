Meteor.methods
	readMessages: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] readMessages -> Invalid user'

		console.log '[methods] readMessages -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId rid, Meteor.userId()
