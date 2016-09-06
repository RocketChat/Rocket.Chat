Meteor.methods
	hideRoom: (rid) ->

		check rid, String

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'hideRoom' }

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId rid, Meteor.userId()
