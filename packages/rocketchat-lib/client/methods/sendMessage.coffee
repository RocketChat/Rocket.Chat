Meteor.methods
	sendMessage: (message) ->
		if not Meteor.userId()
			return false

		if _.trim(message.msg) isnt ''
			if isNaN(TimeSync.serverOffset())
				message.ts = new Date()
			else
				message.ts = new Date(Date.now() + TimeSync.serverOffset())

			user = Meteor.user()
			message.u =
				_id: Meteor.userId()
				username: user.username

			if RocketChat.settings.get('UI_Use_Real_Name')
				message.u.name = user.name

			message.temp = true

			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			RocketChat.promises.run('onClientMessageReceived', message).then (message) ->
				ChatMessage.insert message
				RocketChat.callbacks.run 'afterSaveMessage', message
