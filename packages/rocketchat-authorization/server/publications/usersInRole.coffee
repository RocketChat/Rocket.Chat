Meteor.publish 'usersInRole', (roleName) ->
	unless @userId
		return @ready()

	# @TODO validate permission

	return RocketChat.authz.getUsersInRole roleName
