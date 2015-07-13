Meteor.methods
	loadHistory: (rid, end, limit=20, skip=0) ->
		fromId = Meteor.userId()
		# console.log '[methods] loadHistory -> '.green, 'fromId:', fromId, 'rid:', rid, 'end:', end, 'limit:', limit, 'skip:', skip

		query =
			rid: rid
			ts:
				$lt: end

		options =
			sort:
				ts: -1
			limit: limit
			skip: skip

		return ChatMessage.find(query, options).fetch()
