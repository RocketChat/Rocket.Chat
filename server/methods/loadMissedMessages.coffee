Meteor.methods
	loadMissedMessages: (rid, start) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'loadMissedMessages' }

		fromId = Meteor.userId()
		unless Meteor.call 'canAccessRoom', rid, fromId
			return false

		options =
			sort:
				ts: -1

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { 'editedAt': 0 }

		return RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(rid, start, options).fetch()
