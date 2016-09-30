###
# Mute is a named function that will replace /mute commands
###

class Mute
	constructor: (command, params, item) ->
		if command isnt 'mute' or not Match.test params, String
			return

		username = params.trim()
		if username is ''
			return

		username = username.replace('@', '')

		user = Meteor.users.findOne Meteor.userId()
		mutedUser = RocketChat.models.Users.findOneByUsername username
		room = RocketChat.models.Rooms.findOneById item.rid

		if not mutedUser?
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

		Meteor.call 'muteUserInRoom', { rid: item.rid, username: username }

RocketChat.slashCommands.add 'mute', Mute
