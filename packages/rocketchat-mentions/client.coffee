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

			me = Meteor.user()?.username

			if mentions.length isnt 0
				mentions = _.unique mentions
				mentions = mentions.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(@(#{mentions}):?)\\b", 'g'), (match, mention, username) ->
					if username is 'all'
						return match.replace mention, "<a href=\"\" class=\"mention-link mention-link-me\">#{mention}</a>"

					if not message.temp?
						if not _.findWhere(message.mentions, {username: username})?
							return match

					classes = 'mention-link'
					if username is me
						classes += ' mention-link-me'

					return match.replace mention, "<a href=\"\" class=\"#{classes}\" data-username=\"#{username}\">#{mention}</a>"

			channels = []
			message.msg.replace /(?:^|\s|\n)(?:#)([A-Za-z0-9-_.]+)/g, (match, mention) ->
				channels.push mention

			if channels.length isnt 0
				channels = _.unique channels
				channels = channels.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(#(#{channels}))\\b", 'g'), (match, mention, channel) ->
					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-channel=\"#{channel}\">#{mention}</a>"


			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', MentionsClient