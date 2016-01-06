RocketChat.models.Roles = new Meteor.Collection 'rocketchat_roles'

RocketChat.models.Roles.findUsersInRole = (name, scope, options) ->
	role = @findOne name
	roleScope = role?.scope or 'Users'
	RocketChat.models[roleScope]?.findUsersInRoles?(name, scope, options)

RocketChat.models.Roles.isUserInRoles = (userId, roles, scope) ->
	roles = [].concat roles
	_.some roles, (roleName) =>
		role = @findOne roleName
		roleScope = role?.scope or 'Users'
		return RocketChat.models[roleScope]?.isUserInRole?(userId, roleName, scope)

