Meteor.methods
	loadHistory: (rid, end, limit=20, ls) ->
		fromId = Meteor.userId()
		# console.log '[methods] loadHistory -> '.green, 'fromId:', fromId, 'rid:', rid, 'end:', end, 'limit:', limit, 'skip:', skip

		unless Meteor.call 'canAccessRoom', rid, fromId
			return false

		query =
			_hidden: { $ne: true }
			rid: rid
			ts:
				$lt: end

		options =
			sort:
				ts: -1
			limit: limit

		if not RocketChat.settings.get 'Message_ShowEditedStatus'
			options.fields = { ets: 0 }

		messages = ChatMessage.find(query, options).fetch()
		unreadNotLoaded = 0

		if ls?
			fistMessage = messages[messages.length - 1]
			if fistMessage.ts > ls
				query.ts.$lt = fistMessage.ts
				query.ts.$gt = ls
				delete options.limit
				unreadNotLoaded = ChatMessage.find(query, options).count()

		return {
			messages: messages
			unreadNotLoaded: unreadNotLoaded
		}
