###
# AutoLinker is a named function that will replace links on messages
# @param {Object} message - The message object
###

class AutoLinker
	constructor: (message) ->
		if _.trim message.html
			regUrls = new RegExp(RocketChat.settings.get 'AutoLinker_UrlsRegExp')

			autolinker = new Autolinker
				stripPrefix: RocketChat.settings.get 'AutoLinker_StripPrefix'
				urls: RocketChat.settings.get 'AutoLinker_Urls'
				email: RocketChat.settings.get 'AutoLinker_Email'
				phone: RocketChat.settings.get 'AutoLinker_Phone'
				twitter: false
				replaceFn: (autolinker, match) ->
					if match.getType() is 'url'
						return regUrls.test match.matchedText
					return null

			# Separate text in code blocks and non code blocks
			msgParts = message.html.split /(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/

			for part, index in msgParts
				if part?.length? > 0
					# Verify if this part is code
					codeMatch = part.match /(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/
					if not codeMatch?
						msgParts[index] = autolinker.link part

			# Re-mount message
			message.html = msgParts.join('')

		return message

RocketChat.callbacks.add 'renderMessage', AutoLinker
