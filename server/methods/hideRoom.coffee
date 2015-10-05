Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] hideRoom -> Invalid user'

		console.log '[methods] hideRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId rid, Meteor.userId()
