Meteor.methods
	sendMessage: (msg) ->
		Tracker.nonreactive ->
			now = new Date(Date.now() + TimeSync.serverOffset())

			ChatMessage.upsert { rid: msg.rid, uid: Meteor.userId(), t: 't' },
				$set:
					ts: now
					msg: msg.message
				$unset:
					t: 1
					expireAt: 1

	updateMessage: (msg) ->
		Tracker.nonreactive ->
			now = new Date(Date.now() + TimeSync.serverOffset())

			ChatMessage.update { _id: msg.id, uid: Meteor.userId() },
				$set:
					ets: now
					msg: msg.message
