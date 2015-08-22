Meteor.methods
	loadMissedMessages: (rid, start) ->
		fromId = Meteor.userId()
		# console.log '[methods] loadMissedMessages -> '.green, 'fromId:', fromId, 'rid:', rid, 'start:', start

		unless Meteor.call 'canAccessRoom', rid, fromId
			return false

		query =
			_hidden: { $ne: true }
			rid: rid
			ts:
				$gt: start

		options =
			sort:
				ts: -1

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { ets: 0 }

		return ChatMessage.find(query, options).fetch()
