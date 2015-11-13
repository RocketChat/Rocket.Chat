###
# Me is a named function that will replace /me commands
# @param {Object} message - The message object
###

class Me
	constructor: (command, params, item) ->
		return unless command is "me" and _.trim params
		msg = item
		msg.msg = params
		msg.via = 'me'
		Meteor.call 'sendMessage', msg

RocketChat.slashCommands.add 'me', Me
