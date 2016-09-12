###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

class Invite
	constructor: (command, params, item) ->
		if command isnt 'invite' or not Match.test params, String
			return

		usernames = params.replace(/@/g, '').split(/[\s,]/).filter((a) -> '' != a)
		if 0 == usernames.length
			return

		users = Meteor.users.find({ username: { $in: usernames }})
		currentUser = Meteor.users.findOne Meteor.userId()

		if 0 == users.count()
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('User_doesnt_exist', { postProcess: 'sprintf', sprintf: [ usernames.join(' @') ] }, currentUser.language)
			}
			return

		usernames = usernames.filter((username) ->
			if not RocketChat.models.Rooms.findOneByIdContainigUsername(item.rid, username)?
				return true

			# Cancel if user is already in this room
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_is_already_in_here', { postProcess: 'sprintf', sprintf: [ username ] }, currentUser.language)
			}
			return false
		)

		# Cancel if all users is already in this room
		if 0 == usernames.length
			return

		users.forEach((user) ->
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
		)

RocketChat.slashCommands.add 'invite', Invite
