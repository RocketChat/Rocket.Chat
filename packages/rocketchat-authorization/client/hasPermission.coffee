atLeastOne = (toFind, toSearch) ->
	console.log 'toFind: ', toFind if window.rocketDebug
	console.log 'toSearch: ', toSearch if window.rocketDebug
	return  not _.isEmpty(_.intersection(toFind, toSearch))

all = (toFind, toSearch) ->
	toFind = _.uniq(toFind)
	toSearch = _.uniq(toSearch)
	return _.isEmpty( _.difference( toFind, toSearch))

Template.registerHelper 'hasPermission', (permission, scope) ->
	unless _.isString( scope )
		scope = Roles.GLOBAL_GROUP
	return hasPermission( permission, scope, atLeastOne)

RocketChat.authz.hasAllPermission = (permissions, scope=Roles.GLOBAL_GROUP) ->
	return hasPermission( permissions, scope, all )

RocketChat.authz.hasAtLeastOnePermission = (permissions, scope=Roles.GLOBAL_GROUP) ->
	return hasPermission(permissions, scope, atLeastOne)

hasPermission = (permissions, scope=Roles.GLOBAL_GROUP, strategy) ->
	userId = Meteor.userId()

	unless userId
		return false

	unless RocketChat.authz.subscription.ready()
		return false

	unless _.isArray(permissions)
		permissions = [permissions]

	roleNames = Roles.getRolesForUser(userId, scope)

	userPermissions = []
	for roleName in roleNames
		userPermissions = userPermissions.concat(_.pluck(ChatPermissions.find({roles : roleName }).fetch(), '_id'))

	return strategy( permissions, userPermissions)
