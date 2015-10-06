###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

if Meteor.isClient
	Tracker.autorun ->
		RocketChat.slashCommands.add 'invite', undefined,
			description: TAPi18n.__('Invite_user_to_join_channel')
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
			currentUser = Meteor.users.findOne Meteor.userId()

			if not user?
				console.log 'notify user_doesnt_exist'
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: TAPi18n.__('User_doesnt_exist', { postProcess: 'sprintf', sprintf: [ username ] }, currentUser.language)
				}
				return

			# cancel if the user is already in this room
			if RocketChat.models.Rooms.findOneByIdContainigUsername(item.rid, user.username)?
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: TAPi18n.__('Username_is_already_in_here', { postProcess: 'sprintf', sprintf: [ username ] }, currentUser.language)
				}
				return

			Meteor.runAsUser user._id, ->
				Meteor.call 'joinRoom', item.rid


	RocketChat.slashCommands.add 'invite', Invite
