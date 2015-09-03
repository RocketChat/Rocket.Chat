###
# Leave is a named function that will replace /leave commands
# @param {Object} message - The message object
###

if Meteor.isClient
	RocketChat.slashCommands.add 'leave', undefined,
		description: 'Leave the current channel'
		params: ''

	RocketChat.slashCommands.add 'part', undefined,
		description: 'Leave the current channel'
		params: ''
else
	class Leave
		constructor: (command, params, item) ->
			if(command == "leave" || command == "part")
				Meteor.call 'leaveRoom', item.rid

	RocketChat.slashCommands.add 'leave', Leave
	RocketChat.slashCommands.add 'part', Leave
