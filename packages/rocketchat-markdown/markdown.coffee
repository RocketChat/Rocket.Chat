###
# Markdown is a named function that will parse markdown syntax
# @param {Object} message - The message object
###

class Markdown
	constructor: (message) ->

		msg = message.html or ''

		# Process MD like for strong, italic and strike
		msg = msg.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
		msg = msg.replace(/\_([^_]+)\_/g, '<i>$1</i>')
		msg = msg.replace(/\~([^_]+)\~/g, '<strike>$1</strike>')

		message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', Markdown, RocketChat.callbacks.priority.LOW
