Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			return false

		hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'
		deleteOwn = message?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			return false

		blockDeleteInMinutes = RocketChat.settings.get 'Message_AllowDeleting_BlockDeleteInMinutes'
		if blockDeleteInMinutes? and blockDeleteInMinutes isnt 0
			msgTs = moment(message.ts) if message.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockDeleteInMinutes
				toastr.error t('error-message-deleting-blocked')
				return false

		Tracker.nonreactive ->
			ChatMessage.remove
				_id: message._id
				'u._id': Meteor.userId()
