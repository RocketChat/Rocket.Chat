###
# Mentions is a named function that will process Mentions
# @param {Object} message - The message object
###

class MentionsClient
	constructor: (message) ->
		if _.trim message.html
			msg = message.html

			mentions = []

			msgMentionRegex = new RegExp '(?:^|\\s|\\n)(?:@)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
			message.msg.replace msgMentionRegex, (match, mention) ->
				mentions.push mention

			me = Meteor.user()?.username
			if mentions.length isnt 0
				mentions = _.unique mentions
				mentions = mentions.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(@(#{mentions}):?)[:.,\s]?", 'g'), (match, mention, username) ->
					if username is 'all' or username is 'here'
						return match.replace mention, "<a class=\"mention-link mention-link-me mention-link-all\">#{mention}</a>"

					if not message.temp?
						if not _.findWhere(message.mentions, {username: username})?
							return match

					classes = 'mention-link'
					if username is me
						classes += ' mention-link-me'
					user = Meteor.users.findOne({name:username})
					if (!user)
						user = Meteor.users.findOne({username:username})
					if user?.name
						return match.replace mention, "<a class=\"#{classes}\" data-username=\"#{username}\">@#{user.name}</a>"
					return match.replace mention, "<a class=\"#{classes}\" data-username=\"#{username}\">#{mention}</a>"

			channels = []
			msgChannelRegex = new RegExp '(?:^|\\s|\\n)(?:#)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
			message.msg.replace msgChannelRegex, (match, mention) ->
				channels.push mention

			if channels.length isnt 0
				channels = _.unique channels
				channels = channels.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(#(#{channels}))[:.,\s]?", 'g'), (match, mention, channel) ->
					if not message.temp?
						if not _.findWhere(message.channels, {name: channel})?
							return match
					return match.replace mention, "<a class=\"mention-link\" data-channel=\"#{channel}\">#{mention}</a>"


			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-message'
RocketChat.callbacks.add 'renderMentions', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-mentions'
