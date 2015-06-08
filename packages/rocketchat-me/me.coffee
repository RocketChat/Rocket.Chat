###
# Me is a named function that will replace /me commands
# @param {Object} message - The message object
###

class Me
	constructor: (message) ->
		# If message starts with /me, replace it for text formatting
		if message.msg.indexOf('/me ') is 0
			message.msg = '_' + message.msg.substr(4) + '_'
		return message

RocketChat.callbacks.add 'beforeSaveMessage', Me
