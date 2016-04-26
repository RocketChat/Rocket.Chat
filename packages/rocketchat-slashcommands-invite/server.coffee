###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

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

		try
			Meteor.call 'addUserToRoom',
				rid: item.rid
				username: user.username
		catch e
			if e.error is 'cant-invite-for-direct-room'
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: TAPi18n.__('Cannot_invite_users_to_direct_rooms', null, currentUser.language)
				}
			else
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: TAPi18n.__(e.error, null, currentUser.language)
				}
			return

RocketChat.slashCommands.add 'invite', Invite
