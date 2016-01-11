RocketChat.authz.getRoles = ->
	return RocketChat.models.Roles.find().fetch()
