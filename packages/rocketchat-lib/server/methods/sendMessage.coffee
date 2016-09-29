Meteor.methods
	sendMessage: (message) ->

		check message, Object

		if message.ts
			tsDiff = Math.abs(moment(message.ts).diff())
			if tsDiff > 60000
				throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', { method: 'sendMessage', message_ts: message.ts, server_ts: new Date().getTime() })
			else if tsDiff > 10000
				message.ts = new Date()
		else
			message.ts = new Date()

		if message.msg?.length > RocketChat.settings.get('Message_MaxAllowedSize')
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', { method: 'sendMessage' })

		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'sendMessage' })

		user = RocketChat.models.Users.findOneById Meteor.userId(), fields: username: 1, name: 1

		room = Meteor.call 'canAccessRoom', message.rid, user._id

		if not room
			return false

		if user.username in (room.muted or [])
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: room._id
				ts: new Date
				msg: TAPi18n.__('You_have_been_muted', {}, user.language)
			}
			return false

		message.alias = user.name if not message.alias? and RocketChat.settings.get 'Message_SetNameToAliasEnabled'
		if Meteor.settings.public.sandstorm
			message.sandstormSessionId = this.connection.sandstormSessionId()

		RocketChat.sendMessage user, message, room

# Limit a user to sending 5 msgs/second
DDPRateLimiter.addRule
	type: 'method'
	name: 'sendMessage'
	userId: (userId) ->
		return RocketChat.models.Users.findOneById(userId)?.username isnt RocketChat.settings.get('InternalHubot_Username')
, 5, 1000
