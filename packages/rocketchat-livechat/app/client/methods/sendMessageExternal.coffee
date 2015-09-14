Meteor.methods
	sendMessageLivechat: (message) ->
		if s.trim(message.msg) isnt ''

			message.ts = new Date(Date.now() + TimeSync.serverOffset())

			message.u =
				_id: Meteor.userId()
				username: 'visitor'

			message.temp = true

			# message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.insert message
