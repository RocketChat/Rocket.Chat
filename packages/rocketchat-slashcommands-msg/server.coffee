###
# Msg is a named function that will replace /msg commands
###

class Msg
	constructor: (command, params, item) ->
		if command isnt 'msg' or not Match.test params, String
			return

		trimmedParams = params.trim()

		usernameOrig = trimmedParams.slice(0, trimmedParams.indexOf(' '))
		message = trimmedParams.slice(trimmedParams.indexOf(' ') + 1)

		if username is ''
			return

		username = usernameOrig.replace('@', '')

		user = Meteor.users.findOne Meteor.userId()
		msgUser = RocketChat.models.Users.findOneByUsername username

		if not msgUser?
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_doesnt_exist', { postProcess: 'sprintf', sprintf: [ usernameOrig ] }, user.language)
			}
			return

		rid = Meteor.call 'createDirectMessage', username
		msgObject = { _id: Random.id(), rid: rid.rid, msg: message}
		Meteor.call 'sendMessage', msgObject

RocketChat.slashCommands.add 'msg', Msg
