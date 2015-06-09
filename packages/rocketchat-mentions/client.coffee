###
# Mentions is a named function that will process Mentions
# @param {Object} message - The message object
###

class Mentions
	constructor: (message) ->
		# If message starts with /me, replace it for text formatting
		mentions = []
		message.msg.replace /(?:^|\s|\n)(?:@)([A-Za-z0-9-_.]+)/g, (match, mention) ->
			mentions.push mention
		if mentions.length isnt 0
			message.mentions = _.unique mentions
		return message

RocketChat.callbacks.add 'beforeSaveMessage', Mentions
