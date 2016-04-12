Meteor.subscribe 'roles'

RocketChat.authz.subscription = Meteor.subscribe 'permissions'

RocketChat.AdminBox.addOption
	href: 'admin-permissions'
	i18nLabel: 'Permissions'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('access-permissions')

Meteor.startup ->
	RocketChat.models.Roles.find({ description: { $exists: 1 } }, { fields: { description: 1 } }).observeChanges
		changed: (_id) =>
			ChatMessage.update { roles: _id }, { $inc: { rerender: 1 } }, { multi: true } # Update message to re-render DOM
		removed: (_id) =>
			ChatMessage.update { roles: _id }, { $pull: { roles: _id } }, { multi: true } # Update message to re-render DOM
