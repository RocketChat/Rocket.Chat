###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###

class InviteAll
	constructor: (command, params, item) ->
		return if command isnt 'invite-all' or not Match.test params, String
		regexp = /#([\d-_\w]+)/g
		channel = regexp.exec(params.trim())?[1]
		return if not channel
		room = RocketChat.models.Rooms.findOneByName(channel)
		users = (RocketChat.models.Rooms.findOneById(item.rid)?.usernames) || []
		return if not room
			Meteor.call 'createChannel', channel, users
			
		currentUser = Meteor.users.findOne Meteor.userId()
		users.forEach((user) ->
			try
				RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
					_id: Random.id()
					rid: item.rid
					ts: new Date
					msg: room
				}
				Meteor.call 'addUserToRoom',
					rid: room._id
					username: user
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

RocketChat.slashCommands.add 'invite-all', InviteAll
