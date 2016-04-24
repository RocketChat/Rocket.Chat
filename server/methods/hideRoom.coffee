Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'hideRoom' }

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId rid, Meteor.userId()
