Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		console.log '[methods] updateMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		message.ets = new Date()

		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
			message.urls = urls

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		if RocketChat.settings.get 'Message_KeepHistoryOfEdits'
			console.log 'Message_KeepHistoryOfEdits', true
			
			oldMessage = ChatMessage.findOne message.id
			message.ts = oldMessage.ts
			
			ChatMessage.update
				_id: message.id
				'u._id': Meteor.userId()
			,
				$set: 
					_history: true

			delete message._id
			Meteor.call 'sendMessage', message

		else
			console.log 'Message_KeepHistoryOfEdits', false
			ChatMessage.update
				_id: message.id
				'u._id': Meteor.userId()
			,
				$set: message

		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', ChatMessage.findOne(message.id)