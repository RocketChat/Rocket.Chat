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
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: "No user exists by the name of `#{username}`."#TODO: Make this a language setting
				}
				return

			# cancel if the user is already in this room
			if RocketChat.models.Rooms.findOneByIdContainigUsername(item.rid, user.username)?
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: "`#{username}` is already in here."#TODO: Make this a language setting
				}
				return

			Meteor.runAsUser user._id, ->
				Meteor.call 'joinRoom', item.rid


	RocketChat.slashCommands.add 'invite', Invite
