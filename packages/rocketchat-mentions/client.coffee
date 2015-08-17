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
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(@(#{mentions}))(?:[^A-Za-z0-9-_.])", 'g'), (match, mention, username) ->
					if username is 'all'
						return match.replace mention, "<a href=\"\" class=\"mention-link\">#{mention}</a>"

					if not message.temp?
						if not _.findWhere(message.mentions, {username: username})?
							return match

					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-username=\"#{username}\">#{mention}</a>"

			channels = []
			message.msg.replace /(?:^|\s|\n)(?:#)([A-Za-z0-9-_.]+)/g, (match, mention) ->
				channels.push mention

			if channels.length isnt 0
				channels = _.unique channels
				channels = channels.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(#(#{channels}))(?:[^A-Za-z0-9-_.])", 'g'), (match, mention, channel) ->
					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-channel=\"#{channel}\">#{mention}</a>"


			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', MentionsClient