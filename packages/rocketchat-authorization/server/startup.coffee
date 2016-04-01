Meteor.startup ->

	# Note:
	# 1.if we need to create a role that can only edit channel message, but not edit group message
	# then we can define edit-<type>-message instead of edit-message
	# 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
	permissions = [

		{ _id: 'view-statistics',
		roles : ['admin']}

		{ _id: 'run-import',
		roles : ['admin']}

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


		{ _id: 'create-user',
		roles : ['admin']}

		{ _id: 'edit-other-user-info',
		roles : ['admin']}

		{ _id: 'edit-other-user-password',
		roles : ['admin']}

		{ _id: 'assign-admin-role',
		roles : ['admin']}

		{ _id: 'edit-other-user-active-status',
		roles : ['admin']}

		{ _id: 'delete-user',
		roles : ['admin']}

		{ _id: 'view-other-user-channels',
		roles : ['admin']}

		{ _id: 'add-oauth-service',
		roles : ['admin']}

		{ _id: 'run-migration',
		roles : ['admin']}

		{ _id: 'create-c',
		roles : ['admin', 'user']}

		{ _id: 'delete-c',
		roles : ['admin']}

		{ _id: 'edit-room',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'edit-message',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'delete-message',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'remove-user',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'mute-user',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'ban-user',
		roles : ['admin', 'moderator', 'owner']}

		{ _id: 'set-moderator',
		roles : ['admin', 'owner']}

		{ _id: 'set-owner',
		roles : ['admin', 'owner']}

		{ _id: 'create-p',
		roles : ['admin', 'user']}

		{ _id: 'delete-p',
		roles : ['admin']}

		{ _id: 'delete-d',
		roles : ['admin']}

		{ _id: 'bulk-register-user',
		roles : ['admin']}

		{ _id: 'bulk-create-c',
		roles : ['admin']}

		{ _id: 'view-c-room',
		roles : ['admin', 'user', 'bot']}

		{ _id: 'view-p-room',
		roles : ['admin', 'user']}

		{ _id: 'view-d-room',
		roles : ['admin', 'user']}

		{ _id: 'access-permissions',
		roles : ['admin']}

		{ _id: 'manage-assets',
		roles : ['admin']}

		{ _id: 'manage-integrations',
		roles : ['admin', 'bot']}

		{ _id: 'manage-oauth-apps',
		roles : ['admin']},

		{ _id: 'view-logs',
		roles : ['admin']}
	]

	for permission in permissions
		unless RocketChat.models.Permissions.findOneById( permission._id)?
			RocketChat.models.Permissions.upsert( permission._id, {$set: permission })

	defaultRoles = [
		{ name: 'admin', scope: 'Users', description: 'Rocket.Chat admins' }
		{ name: 'moderator', scope: 'Subscriptions', description: 'Room moderators' }
		{ name: 'owner', scope: 'Subscriptions', description: 'Room owners' }
		{ name: 'user', scope: 'Users', description: 'Users' }
		{ name: 'bot', scope: 'Users', description: 'Bots' }
	]

	for role in defaultRoles
		RocketChat.models.Roles.createOrUpdate role.name, role.scope, role.description, true
