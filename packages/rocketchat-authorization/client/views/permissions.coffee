Template.permissions.helpers

	role: ->
		return Roles.getAllRoles()

	permission: ->
		return ChatPermissions.find()

	granted: (roles) ->
		if roles?
			return 'YES' if roles.indexOf(@name) isnt -1


Template.permissions.onCreated ->
	# @roles = []
	# @permissions = []
	# @permissionByRole = {}

	@subscribe 'roles'

	# ChatPermissions
