Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', message.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'
		deleteOwn = message?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] deleteMessage -> Message deleting not allowed"

		console.log '[methods] deleteMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		keepHistory = RocketChat.settings.get 'Message_KeepHistory'
		showDeletedStatus = RocketChat.settings.get 'Message_ShowDeletedStatus'

		deleteQuery = 
			_id: message._id
		#deleteQuery['u._id'] = Meteor.userId() if user?.admin isnt true 

		if keepHistory
			if showDeletedStatus
				history = ChatMessage.findOne message._id
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
			RocketChat.Notifications.notifyRoom message.rid, 'deleteMessage', { _id: message._id }
