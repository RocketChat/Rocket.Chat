###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

class Invite
	constructor: (command, params, item) ->
		if(command == "invite")
			if _.trim params
				user = Meteor.users.findOne({ username: String(params) })

				if user?
					Meteor.runAsUser user._id, ->
						Meteor.call 'joinRoom', item.rid

RocketChat.slashCommands.add 'invite', Invite
