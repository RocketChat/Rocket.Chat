Meteor.methods
	sendMessage: (msg) ->
		Tracker.nonreactive ->
			now = new Date(Date.now() + TimeSync.serverOffset())

			msg = RocketChat.callbacks.run 'sendMessage', msg

			ChatMessage.upsert { rid: msg.rid, t: 't' },
				$set:
					ts: now
					msg: msg.message
					'u.username': Meteor.user().username
				$unset:
					t: 1
					expireAt: 1

	updateMessage: (msg) ->
		Tracker.nonreactive ->
			now = new Date(Date.now() + TimeSync.serverOffset())

			ChatMessage.update { _id: msg.id, 'u._id': Meteor.userId() },
				$set:
					ets: now
					msg: msg.message
