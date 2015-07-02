Meteor.methods
	typingStatus: (rid, start) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		filter =
			rid: rid
			$and: [{'u._id': Meteor.userId()}]

		if start

			msgData =
				'$setOnInsert':
					'u._id': Meteor.userId()
					'u.username': Meteor.user().username
			ChatTyping.upsert(filter, msgData)

		else

			ChatTyping.remove(filter)
