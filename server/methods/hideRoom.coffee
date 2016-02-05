Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] hideRoom -> Invalid user'

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId rid, Meteor.userId()
