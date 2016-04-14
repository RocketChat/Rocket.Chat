Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			return false

		hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'
		deleteOwn = message?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			return false


		Tracker.nonreactive ->
			ChatMessage.remove
				_id: message._id
				'u._id': Meteor.userId()
