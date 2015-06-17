Meteor.methods
	typingStatus: (rid, start) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		filter =
			t: 't'
			rid: rid
			$and: [{'u._id': Meteor.userId()}]

		if start

			msgData =
				'$set':
					expireAt: moment().add(30, 'seconds').toDate()
				'$setOnInsert':
					msg: '...'
					'u._id': Meteor.userId()
					'u.username': Meteor.user().username
					ts: moment().add(1, 'years').toDate()
			ChatMessage.upsert(filter, msgData)

		else

			ChatMessage.remove(filter)
