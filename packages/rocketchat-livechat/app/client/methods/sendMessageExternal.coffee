Meteor.methods
	sendMessageLivechat: (message) ->
		if s.trim(message.msg) isnt ''

			if isNaN(TimeSync.serverOffset())
				message.ts = new Date()
			else
				message.ts = new Date(Date.now() + TimeSync.serverOffset())

			message.u =
				_id: Meteor.userId()
				username: Meteor.user()?.username || 'visitor'

			message.temp = true

			# message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.insert message
