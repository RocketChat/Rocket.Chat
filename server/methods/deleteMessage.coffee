Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowDeleting'
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] updateMessage -> Message deleting not allowed"


		console.log '[methods] deleteMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		keepHistory = RocketChat.settings.get 'Message_KeepHistory'
		showDeletedStatus = RocketChat.settings.get 'Message_ShowDeletedStatus'

		if keepHistory
			if showDeletedStatus
				history = ChatMessage.findOne message._id
				history._hidden = true
				history.parent = history._id
				history.ets = new Date()
				delete history._id
				ChatMessage.insert history
			else
				ChatMessage.update
					_id: message._id
					'u._id': Meteor.userId()
				,
					$set: 
						_hidden: true

		else
			if not showDeletedStatus
				ChatMessage.remove
					_id: message._id
					'u._id': Meteor.userId()

		if showDeletedStatus
			ChatMessage.update
				_id: message._id
				'u._id': Meteor.userId()
			,
				$set: 
					msg: ''
					t: 'rm'
					ets: new Date()
		else
			deleteMsgStream.emit message.rid, { _id: message._id }
