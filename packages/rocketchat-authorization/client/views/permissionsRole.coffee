window.rolee = Roles

Template.permissionsRole.helpers

	role: ->
		return Roles.getAllRoles()

	permission: ->
		return ChatPermissions.find()

	granted: (roles) ->
		if roles?
			return 'YES' if roles.indexOf(@name) isnt -1


Template.permissionsRole.onCreated ->
	# @roles = []
	# @permissions = []
	# @permissionByRole = {}

	console.log Roles

	@subscribe 'userInRole', FlowRouter.getParam('name')

	# ChatPermissions
