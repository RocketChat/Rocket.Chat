###
# Unmute is a named function that will replace /unmute commands
###

class Unmute
	constructor: (command, params, item) ->
		if command isnt 'unmute' or not Match.test params, String
			return

		username = params.trim()
		if username is ''
			return

		username = username.replace('@', '')

		user = Meteor.users.findOne Meteor.userId()
		unmutedUser = RocketChat.models.Users.findOneByUsername username
		room = RocketChat.models.Rooms.findOneById item.rid

		if not unmutedUser?
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_doesnt_exist', { postProcess: 'sprintf', sprintf: [ username ] }, user.language);
			}
			return

		if username not in (room.usernames or [])
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_is_not_in_this_room', { postProcess: 'sprintf', sprintf: [ username ] }, user.language);
			}
			return

		Meteor.call 'unmuteUserInRoom', { rid: item.rid, username: username }

RocketChat.slashCommands.add 'unmute', Unmute
