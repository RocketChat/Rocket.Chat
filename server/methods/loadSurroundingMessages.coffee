Meteor.methods
	loadSurroundingMessages: (message, limit=50) ->
		fromId = Meteor.userId()

		unless message._id
			return false

		message = RocketChat.models.Messages.findOneById(message._id);

		unless message?.rid
			return false

		unless Meteor.call 'canAccessRoom', message.rid, fromId
			return false

		limit = limit - 1

		options =
			sort:
				ts: -1
			limit: Math.ceil(limit/2)

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { 'editedAt': 0 }

		records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(message.rid, message.ts, options).fetch()
		messages = _.map records, (message) ->
			message.starred = _.findWhere message.starred, { _id: fromId }
			return message

		moreBefore = messages.length is options.limit

		messages.push message

		options.sort = { ts: 1 }
		options.limit = Math.floor(limit/2)

		records = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(message.rid, message.ts, options).fetch()
		afterMessages = _.map records, (message) ->
			message.starred = _.findWhere message.starred, { _id: fromId }
			return message

		moreAfter = afterMessages.length is options.limit

		messages = messages.concat afterMessages

		return {
			messages: messages
			moreBefore: moreBefore
			moreAfter: moreAfter
		}
