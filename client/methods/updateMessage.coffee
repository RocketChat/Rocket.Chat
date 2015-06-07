Meteor.methods
	updateMessage: (message) ->
		Tracker.nonreactive ->

			message.ets = new Date(Date.now() + TimeSync.serverOffset())
			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.update
				_id: message.id
				'u._id': Meteor.userId()
			,
				$set:
					ets: message.ets
					message: message.msg
