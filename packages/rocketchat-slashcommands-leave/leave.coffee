###
# Invite is a named function that will replace /leave commands
# @param {Object} message - The message object
###

class Leave
	constructor: (command, params, item) ->
		if(command == "leave" || command == "part")
			Meteor.call 'leaveRoom', item.rid

RocketChat.slashCommands.add 'leave', Leave
RocketChat.slashCommands.add 'part', Leave
