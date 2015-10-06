# Limit sending messages to 5 messages per second per user
DDPRateLimiter.addRule
	userId: (userId) ->
		return RocketChat.models.Users.findOneById(userId)?.username isnt RocketChat.settings.get('RocketBot_Name')
	clientAddress: null
	type: 'method'
	name: 'sendMessage'
	connectionId: ->
		return true
, 5, 1000


# Limit changing avatar once per minute
DDPRateLimiter.addRule
	userId: -> return true
	connectionId: -> return true
	clientAddress: null
	type: 'method'
	name: 'setAvatarFromService'
, 1, 60000


# Limit changing avatar once per minute
DDPRateLimiter.addRule
	userId: -> return true
	connectionId: -> return true
	clientAddress: null
	type: 'method'
	name: 'resetAvatar'
, 1, 60000

# Limit setting username once per minute
DDPRateLimiter.addRule
	userId: -> return not RocketChat.authz.hasPermission( user._id, 'edit-other-user-info')
	connectionId: -> return true
	clientAddress: null
	type: 'method'
	name: 'setUsername'
, 1, 60000

