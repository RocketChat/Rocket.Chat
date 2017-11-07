Package.describe({
	name: 'rocketchat:authorization',
	version: '0.0.1',
	summary: 'Role based authorization of actions',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.use('mongo', ['client', 'server']);
	api.use('kadira:flow-router', 'client');
	api.use('tracker', 'client');

	api.use('templating', 'client');

	api.addFiles('lib/rocketchat.js', ['server', 'client']);

	api.addFiles('client/lib/ChatPermissions.js', ['client']);
	api.addFiles('client/lib/models/Roles.js', ['client']);
	api.addFiles('client/lib/models/Users.js', ['client']);
	api.addFiles('client/lib/models/Subscriptions.js', ['client']);

	api.addFiles('client/startup.js', ['client']);
	api.addFiles('client/hasPermission.js', ['client']);
	api.addFiles('client/hasRole.js', ['client']);
	api.addFiles('client/requiresPermission.html', ['client']);

	api.addFiles('client/route.js', ['client']);
	api.addFiles('client/usersNameChanged.js', ['client']);

	// views
	api.addFiles('client/views/permissions.html', ['client']);
	api.addFiles('client/views/permissions.js', ['client']);
	api.addFiles('client/views/permissionsRole.html', ['client']);
	api.addFiles('client/views/permissionsRole.js', ['client']);

	// stylesheets
	api.addFiles('client/stylesheets/permissions.css', 'client');

	api.addFiles('server/models/Permissions.js', ['server']);
	api.addFiles('server/models/Roles.js', ['server']);
	api.addFiles('server/models/Base.js', ['server']);
	api.addFiles('server/models/Users.js', ['server']);
	api.addFiles('server/models/Subscriptions.js', ['server']);

	api.addFiles('server/functions/addUserRoles.js', ['server']);
	api.addFiles('server/functions/canAccessRoom.js', ['server']);
	api.addFiles('server/functions/getRoles.js', ['server']);
	api.addFiles('server/functions/getUsersInRole.js', ['server']);
	api.addFiles('server/functions/hasPermission.js', ['server']);
	api.addFiles('server/functions/hasRole.js', ['server']);
	api.addFiles('server/functions/removeUserFromRoles.js', ['server']);

	// publications
	api.addFiles('server/publications/permissions.js', 'server');
	api.addFiles('server/publications/roles.js', 'server');
	api.addFiles('server/publications/usersInRole.js', 'server');

	// methods
	api.addFiles('server/methods/addUserToRole.js', 'server');
	api.addFiles('server/methods/deleteRole.js', 'server');
	api.addFiles('server/methods/removeUserFromRole.js', 'server');
	api.addFiles('server/methods/saveRole.js', 'server');
	api.addFiles('server/methods/addPermissionToRole.js', 'server');
	api.addFiles('server/methods/removeRoleFromPermission.js', 'server');

	api.addFiles('server/startup.js', ['server']);
});
