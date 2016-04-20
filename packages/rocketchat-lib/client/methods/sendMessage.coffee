Meteor.methods
	sendMessage: (message) ->
		if not Meteor.userId()
			return false

		if _.trim(message.msg) isnt ''

			message.ts = new Date(Date.now() + TimeSync.serverOffset())

			message.u =
				_id: Meteor.userId()
				username: Meteor.user().username

			message.temp = true

			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			RocketChat.promises.run('onClientMessageReceived', message).then (message) ->

				ChatMessage.insert message
