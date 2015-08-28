Meteor.methods
	unpinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'message-pinning-not-allowed', t('Message_pinning_not_allowed')

		Tracker.nonreactive ->

			message.pts = new Date(Date.now() + TimeSync.serverOffset())
			message.pinned = false
			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.update
				_id: message.id
				'u._id': Meteor.userId()
			,
				$set:
					pinned: message.pinned
					pts: message.pts
