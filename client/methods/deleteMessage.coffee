Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('general.User_logged_out')

		hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'
		deleteOwn = message?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			throw new Meteor.Error 'message-deleting-not-allowed', t('Message_deleting_not_allowed')

		blockDeleteInMinutes = RocketChat.settings.get 'Message_AllowDeleting_BlockDeleteInMinutes'
		if blockDeleteInMinutes? and blockDeleteInMinutes isnt 0
			msgTs = moment(message.ts) if message.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockDeleteInMinutes
				toastr.error t('Message_deleting_blocked')
				throw new Meteor.Error 'message-deleting-blocked'

		Tracker.nonreactive ->
			ChatMessage.remove
				_id: message._id
				'u._id': Meteor.userId()
