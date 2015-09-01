###
# Invite is a named function that will replace /kick commands
# @param {Object} message - The message object
###

class Kick
	constructor: (command, params, item) ->
		if(command == "kick")
			if _.trim params
				user = Meteor.user()

				unless user?.admin is true
					throw new Meteor.Error 503, 'Not authorized'

				kickee = Meteor.users.findOne({ username: params })

				if kickee?

					Meteor.runAsUser kickee._id, ->
						Meteor.call 'leaveRoom', item.rid

RocketChat.slashCommands.add 'kick', Kick
