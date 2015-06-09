###
# Me is a named function that will replace /me commands
# @param {Object} message - The message object
###

class Me
	constructor: (message) ->
		# If message starts with /me, replace it for text formatting
		if message.msg.indexOf('/me ') is 0
			message.html = '_' + message.html.replace('/me ','') + '_'
		return message

RocketChat.callbacks.add 'renderMessage', Me
