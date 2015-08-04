Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		Tracker.nonreactive ->

			message.ets = new Date(Date.now() + TimeSync.serverOffset())
			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.update
				_id: message.id
				'u._id': Meteor.userId()
			,
				$set:
					ets: message.ets
					msg: message.msg