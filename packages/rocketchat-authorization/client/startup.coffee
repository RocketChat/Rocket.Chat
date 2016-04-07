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
			console.log('rolechanged');
			ChatMessage.update { roles: _id }, { $inc: { rerender: 1 } }, { multi: true } # Update message to re-render DOM
		removed: (_id) =>
			console.log('roleremoved');
			ChatMessage.update { roles: _id }, { $pull: { roles: _id } }, { multi: true } # Update message to re-render DOM

	# Meteor.users.find({}, { fields: { roles: 1 } }).observeChanges
	# 	added: (_id, user) =>
	# 		console.log('useradded', _id);
	# 		ChatMessage.update { "u._id": _id }, { $set: { roles: _id } }, { multi: true } # Update message to re-render DOM
	# 	changed: (_id, user) =>
	# 		console.log('userchanged', _id);
	# 		roomRoles = RoomRoles.findOne({ rid: @data._id, "u._id": _id }).fetch();
	# 		ChatMessage.update { rid: @data._id, "u._id": _id }, { $addToSet: { roles: _id } }, { multi: true } # Update message to re-render DOM
