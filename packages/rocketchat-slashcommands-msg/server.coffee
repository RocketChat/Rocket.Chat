###
# Msg is a named function that will replace /msg commands
###

class Msg
	constructor: (command, params, item) ->
		if command isnt 'msg' or not Match.test params, String
			return

		trimmedParams = params.trim()
		separator = trimmedParams.indexOf(' ')

		user = Meteor.users.findOne Meteor.userId()

		if separator is -1
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_and_message_must_not_be_empty', null, user.language)
			}
			return

		message = trimmedParams.slice(separator + 1)

		targetUsernameOrig = trimmedParams.slice(0, separator)
		targetUsername = targetUsernameOrig.replace('@', '')
		targetUser = RocketChat.models.Users.findOneByUsername targetUsername

		if not targetUser?
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Username_doesnt_exist', { postProcess: 'sprintf', sprintf: [ targetUsernameOrig ] }, user.language)
			}
			return

		rid = Meteor.call 'createDirectMessage', targetUsername
		msgObject = { _id: Random.id(), rid: rid.rid, msg: message}
		Meteor.call 'sendMessage', msgObject

RocketChat.slashCommands.add 'msg', Msg
