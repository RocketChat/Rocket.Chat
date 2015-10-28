Meteor.methods
	loadHistory: (rid, end, limit=20, ls) ->
		fromId = Meteor.userId()
		# console.log '[methods] loadHistory -> '.green, 'fromId:', fromId, 'rid:', rid, 'end:', end, 'limit:', limit, 'skip:', skip

		unless Meteor.call 'canAccessRoom', rid, fromId
			return false

		options =
			sort:
				ts: -1
			limit: limit

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { ets: 0 }

		if end?
			records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(rid, end, options).fetch()
		else
			records = RocketChat.models.Messages.findVisibleByRoomId(rid, options).fetch()

		messages = _.map records, (message) ->
			message.starred = _.findWhere message.starred, { _id: fromId }
			return message

		unreadNotLoaded = 0

		if ls?
			firstMessage = messages[messages.length - 1]
			if firstMessage?.ts > ls
				delete options.limit
				unreadNotLoaded = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestamps(rid, ls, firstMessage.ts).count()

		return {
			messages: messages
			unreadNotLoaded: unreadNotLoaded
		}
