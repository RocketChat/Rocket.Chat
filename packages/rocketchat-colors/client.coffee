###
# Colors is a named function that will process Colors
# @param {Object} message - The message object
###

class ColorsClient
	constructor: (message) ->
		if _.trim message.html
			msg = message.html

			msg = msg.replace /(?:^|\s|\n)(#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?)\b/g, (match, completeColor) ->
				return match.replace completeColor, "<div class=\"message-color\"><div class=\"message-color-sample\" style=\"background-color:#{completeColor}\"></div>#{completeColor.toUpperCase()}</div>"

			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', ColorsClient, RocketChat.callbacks.priority.MEDIUM
