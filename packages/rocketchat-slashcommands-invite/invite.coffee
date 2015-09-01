###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

if Meteor.isClient
	RocketChat.slashCommands.add 'invite', undefined,
		description: 'Invite one user to join this channel'
		params: '@username'
else
	class Invite
		constructor: (command, params, item) ->
			if command isnt 'invite' or not Match.test params, String
				return

			username = params.trim()
			if username is ''
				return

			username = username.replace('@', '')

			user = Meteor.users.findOne({ username: username })

			if not user?
				return

			Meteor.runAsUser user._id, ->
				Meteor.call 'joinRoom', item.rid


	RocketChat.slashCommands.add 'invite', Invite
