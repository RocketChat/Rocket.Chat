Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		originalMessage = ChatMessage.findOne message._id, {fields: {u: 1, rid: 1}}
		if not originalMessage?
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] deleteMessage -> Message with id [#{message._id} dos not exists]"

		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'


		deleteOwn = originalMessage?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] deleteMessage -> Message deleting not allowed"

		console.log '[methods] deleteMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		keepHistory = RocketChat.settings.get 'Message_KeepHistory'
		showDeletedStatus = RocketChat.settings.get 'Message_ShowDeletedStatus'

		deleteQuery =
			_id: originalMessage._id

		if keepHistory
			if showDeletedStatus
				history = ChatMessage.findOne originalMessage._id
				history._hidden = true
				history.parent = history._id
				history.ets = new Date()
				delete history._id
				ChatMessage.insert history
			else
				ChatMessage.update deleteQuery,
					$set:
						_hidden: true

		else
			if not showDeletedStatus
				ChatMessage.remove deleteQuery

		if showDeletedStatus
			ChatMessage.update deleteQuery,
				$set:
					msg: ''
					t: 'rm'
					ets: new Date()
		else
			RocketChat.Notifications.notifyRoom originalMessage.rid, 'deleteMessage', { _id: originalMessage._id }
