Meteor.methods
	sendMessage: (message) ->
		Tracker.nonreactive ->

			message.ts = new Date(Date.now() + TimeSync.serverOffset())
			message.u =
				_id: Meteor.userId()
				username: Meteor.user().username
			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.upsert
				rid: message.rid
				t: 't'
			,
				$set: message
				$unset:
					t: 1
					expireAt: 1
