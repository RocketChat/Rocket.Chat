Meteor.methods
	typingStatus: (typingData, start) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		fromId = Meteor.userId()
		console.log '[methods] typingStatus -> '.green, 'fromId:', fromId, 'typingData:', typingData, 'start:', start

		filter =
			t: 't'
			rid: typingData.rid
			uid: Meteor.userId()

		if start
			msgData =
				'$set':
					expireAt: moment().add(30, 'seconds').toDate()
				'$setOnInsert':
					msg: '...'
					ts: moment().add(1, 'years').toDate()

			ChatMessage.upsert(filter, msgData)
		else

			ChatMessage.remove(filter)
