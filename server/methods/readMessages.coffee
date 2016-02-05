Meteor.methods
	readMessages: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] readMessages -> Invalid user'

		RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId rid, Meteor.userId()
