###
# AutoLinker is a named function that will replace links on messages
# @param {Object} message - The message object
###

class AutoLinker
	constructor: (message) ->
		if _.trim message.html
			message.html = Autolinker.link(message.html, { stripPrefix: false, twitter: false })
		
		return message

RocketChat.callbacks.add 'renderMessage', AutoLinker
