###
# Me is a named function that will replace /me commands
# @param {Object} message - The message object
###

class Me
	constructor: (message) ->
		if _.trim message.html
			# If message starts with /me, replace it for text formatting
			if message.html.indexOf('/me ') is 0
				message.html = '_' + message.html.replace('/me ','') + '_'
		return message

RocketChat.callbacks.add 'renderMessage', Me
