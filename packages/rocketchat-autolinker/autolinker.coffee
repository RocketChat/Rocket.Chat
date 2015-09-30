###
# AutoLinker is a named function that will replace links on messages
# @param {Object} message - The message object
###

class AutoLinker
	constructor: (message) ->
		if _.trim message.html
			# Separate text in code blocks and non code blocks
			msgParts = message.html.split /(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/

			for part, index in msgParts
				if part?.length? > 0
					# Verify if this part is code
					codeMatch = part.match /(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/
					if not codeMatch?
						msgParts[index] = Autolinker.link part,
							stripPrefix: false
							twitter: false
							replaceFn: (autolinker, match) ->
								if match.getType() is 'url'
									return /(:\/\/|www\.).+/.test match.matchedText
								return true

			# Re-mount message
			message.html = msgParts.join('')

		return message

RocketChat.callbacks.add 'renderMessage', AutoLinker
