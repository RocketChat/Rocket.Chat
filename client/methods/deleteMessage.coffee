Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('general.User_logged_out')

		if not RocketChat.settings.get 'Message_AllowDeleting'
			throw new Meteor.Error 'message-deleting-not-allowed', t('Message_deleting_not_allowed')

		Tracker.nonreactive ->
			ChatMessage.remove
				_id: message._id
				'u._id': Meteor.userId()
