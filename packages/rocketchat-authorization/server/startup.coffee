Meteor.startup ->

	# Note:
	# 1.if we need to create a role that can only edit channel message, but not edit group message
	# then we can define edit-<type>-message instead of edit-message
	# 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
	permissions = [

		{ _id: 'view-statistics',
		roles : ['admin', 'temp-role']}

		{ _id: 'view-privileged-setting',
		roles : ['admin']}

		{ _id: 'edit-privileged-setting',
		roles : ['admin']}

		{ _id: 'view-room-administration',
		roles : ['admin']}

		{ _id: 'view-user-administration',
		roles : ['admin']}

		{ _id: 'view-full-other-user-info',
		roles : ['admin']}

		{ _id: 'edit-other-user-info',
		roles : ['admin']}

		{ _id: 'assign-admin-role',
		roles : ['admin']}

		{ _id: 'edit-other-user-active-status',
		roles : ['admin', 'site-moderator']}

		{ _id: 'delete-user',
		roles : ['admin']}

		{ _id: 'view-other-user-channels',
		roles : ['admin']}

		{ _id: 'add-oauth-service',
		roles : ['admin']}

		{ _id: 'run-migration',
		roles : ['admin']}

		{ _id: 'create-c',
		roles : ['admin', 'site-moderator', 'user']}

		{ _id: 'delete-c',
		roles : ['admin', 'site-moderator']}

		{ _id: 'edit-room',
		roles : ['admin', 'site-moderator', 'moderator']}

		{ _id: 'edit-message',
		roles : ['admin', 'site-moderator', 'moderator']}

		{ _id: 'delete-message',
		roles : ['admin', 'site-moderator', 'moderator']}

		{ _id: 'ban-user',
		roles : ['admin', 'site-moderator', 'moderator']}

		{ _id: 'create-p',
		roles : ['admin', 'site-moderator', 'user']}

		{ _id: 'delete-p',
		roles : ['admin', 'site-moderator']}

		{ _id: 'delete-d',
		roles : ['admin', 'site-moderator']}

	]

	#alanning:roles
	roles = _.pluck(Roles.getAllRoles().fetch(), 'name');

	for permission in permissions
		RocketChat.models.Permissions.upsert( permission._id, {$setOnInsert : permission })
		for role in permission.roles
			unless role in roles
				Roles.createRole role
				roles.push(role)


