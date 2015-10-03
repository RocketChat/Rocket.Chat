# Limit sending messages to 5 messages per second per user
DDPRateLimiter.addRule
	userId: (userId) ->
		return Meteor.users.findOne(userId)?.username isnt RocketChat.settings.get('RocketBot_Name')
	clientAddress: null
	type: 'method'
	name: 'sendMessage'
	connectionId: ->
		return true
, 5, 1000

