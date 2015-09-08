Meteor.methods
	countAndFirstId: (rid) ->
		subscription = ChatSubscription.findOne
			rid: rid
			'u._id': Meteor.userId()

		query =
			rid: rid
			ts:
				$gt: subscription.ls
			'u._id':
				$ne: Meteor.userId()

		options =
			sort:
				ts: 1
			limit: 1

		firstUnread = ChatMessage.find(query, options).fetch()[0]
		if not firstUnread?
			return {
				firstUnreadId: undefined
				count: 0
				since: subscription.ls
			}

		options =
			sort:
				ts: 1

		count = ChatMessage.find(query, options).count()

		return {
			firstUnreadId: firstUnread._id
			count: count
			since: subscription.ls
		}
