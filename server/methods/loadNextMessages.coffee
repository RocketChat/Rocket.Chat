Meteor.methods
	loadNextMessages: (rid, end, limit=20) ->
		fromId = Meteor.userId()
		console.log '[methods] loadNextMessages -> '.green, 'fromId:', fromId, 'rid:', rid, 'end:', end, 'limit:', limit

		unless Meteor.call 'canAccessRoom', rid, fromId
			return false

		options =
			sort:
				ts: 1
			limit: limit

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { 'editedAt': 0 }

		if end?
			records = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch()
		else
			records = RocketChat.models.Messages.findVisibleByRoomId(rid, options).fetch()

		messages = _.map records, (message) ->
			message.starred = _.findWhere message.starred, { _id: fromId }
			return message

		return {
			messages: messages
		}
