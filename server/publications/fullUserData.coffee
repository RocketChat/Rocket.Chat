Meteor.publish 'fullUserData', (filter, limit) ->
	unless @userId
		return @ready()

	result = RocketChat.getFullUserData { userId: @userId, filter, limit }

	if not result
		return @ready()

	return result
