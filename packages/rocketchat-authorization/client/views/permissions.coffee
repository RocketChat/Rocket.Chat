Template.permissions.helpers

	role: ->
		return Template.instance().roles.get()

	permission: ->
		return ChatPermissions.find({}, { sort: { _id: 1 } })

	granted: (roles) ->
		if roles?
			return 'checked' if roles.indexOf(@_id) isnt -1

	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'access-permissions'

Template.permissions.events
	'click .role-permission': (e, instance) ->
		permission = e.currentTarget.getAttribute('data-permission')
		role = e.currentTarget.getAttribute('data-role')

		if instance.permissionByRole[permission].indexOf(role) is -1
			Meteor.call 'authorization:addPermissionToRole', permission, role
		else
			Meteor.call 'authorization:removeRoleFromPermission', permission, role

Template.permissions.onCreated ->
	@roles = new ReactiveVar []
	@permissionByRole = {}

	@actions =
		added: {}
		removed: {}

	Tracker.autorun =>
		@roles.set RocketChat.models.Roles.find().fetch()

	Tracker.autorun =>
		ChatPermissions.find().observeChanges
			added: (id, fields) =>
				@permissionByRole[id] = fields.roles
			changed: (id, fields) =>
				@permissionByRole[id] = fields.roles
			removed: (id) =>
				delete @permissionByRole[id]
