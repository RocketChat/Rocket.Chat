Meteor.methods
	sendMessageExternal: (message) ->
		# if not Meteor.userId()
		# 	throw new Meteor.Error 203, t('User_logged_out')

		if _.trim(message.msg) isnt ''

			message.ts = new Date(Date.now() + TimeSync.serverOffset())

			message.u =
				# _id: Meteor.userId()
				username: 'visitor'

			message.temp = true

			# message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.insert message
