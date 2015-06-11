###
# Mentions is a named function that will process Mentions
# @param {Object} message - The message object
###

class MentionsClient
	constructor: (message) ->
		if _.trim message.html
			msg = message.html

			mentions = []
			message.msg.replace /(?:^|\s|\n)(?:@)([A-Za-z0-9-_.]+)/g, (match, mention) ->
				mentions.push mention
			if mentions.length isnt 0
				mentions = _.unique mentions
				mentions = mentions.join('|')
				msg = msg.replace new RegExp("(?:^|\\s)(@(#{mentions}))(?:\\s|$)", 'g'), (match, mention, username) ->
					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-username=\"#{username}\">#{mention}</a>"

			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', MentionsClient