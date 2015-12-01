Meteor.publish 'roles', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'access-permissions'
		throw new Meteor.Error "not-authorized"

	return RocketChat.authz.getRoles()
