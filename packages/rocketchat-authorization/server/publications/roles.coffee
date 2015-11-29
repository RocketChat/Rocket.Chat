Meteor.publish 'roles', ->
	unless @userId
		return @ready()

	# @TODO validate permission

	return RocketChat.authz.getRoles()
