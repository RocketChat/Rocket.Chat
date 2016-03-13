Meteor.publish 'usersInRole', (roleName, page = 1) ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'access-permissions'
		throw new Meteor.Error "not-authorized"

	itemsPerPage = 20
	pagination =
		sort:
			name: 1
		limit: itemsPerPage
		offset: itemsPerPage * (page - 1)

	return RocketChat.authz.getUsersInRole roleName, null, pagination
