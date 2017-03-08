###
# Join is a named function that will replace /join commands
# @param {Object} message - The message object
###

class Join
	constructor: (command, params, item) ->
		if command isnt 'join' or not Match.test params, String
			return

		channel = params.trim()
		if channel is ''
			return

		channel = channel.replace('#', '')

		user = Meteor.users.findOne Meteor.userId()
		room = RocketChat.models.Rooms.findOneByNameAndType channel, 'c'
		
		if not room
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message',
				_id: Random.id()
				rid: item.rid
				ts: new Date
				msg: TAPi18n.__('Channel_doesnt_exist', { postProcess: 'sprintf', sprintf: [ channel ] }, user.language)
			
		throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
			method: 'slashCommands'
		}) if room.usernames.indexOf(user.username) > -1
		
		Meteor.call 'joinRoom', room._id

RocketChat.slashCommands.add 'join', Join
