Package.describe({
	name: 'rocketchat:authorization',
	version: '0.0.1',
	summary: 'Role based authorization of actions',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');
	api.use([
		'ecmascript',
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.use('mongo', ['client', 'server']);
	api.use('kadira:flow-router', 'client');
	api.use('less@2.5.1', 'client');
	api.use('tracker', 'client');

	api.use('templating', 'client');

	api.addFiles('lib/rocketchat.coffee', ['server', 'client']);

	api.addFiles('client/lib/ChatPermissions.coffee', ['client']);
	api.addFiles('client/lib/models/Roles.coffee', ['client']);
	api.addFiles('client/lib/models/Users.js', ['client']);
	api.addFiles('client/lib/models/Subscriptions.js', ['client']);

	api.addFiles('client/startup.coffee', ['client']);
	api.addFiles('client/hasPermission.coffee', ['client']);
	api.addFiles('client/hasRole.coffee', ['client']);

	api.addFiles('client/route.coffee', ['client']);

	// views
	api.addFiles('client/views/permissions.html', ['client']);
	api.addFiles('client/views/permissions.coffee', ['client']);
	api.addFiles('client/views/permissionsRole.html', ['client']);
	api.addFiles('client/views/permissionsRole.coffee', ['client']);

	// stylesheets
	api.addFiles('client/stylesheets/permissions.less', 'client');

	api.addFiles('server/models/Permissions.coffee', ['server']);
	api.addFiles('server/models/Roles.coffee', ['server']);
	api.addFiles('server/models/Base.js', ['server']);
	api.addFiles('server/models/Users.js', ['server']);
	api.addFiles('server/models/Subscriptions.js', ['server']);

	api.addFiles('server/functions/addUserRoles.coffee', ['server']);
	api.addFiles('server/functions/canAccessRoom.js', ['server']);
	api.addFiles('server/functions/getRoles.coffee', ['server']);
	api.addFiles('server/functions/getUsersInRole.coffee', ['server']);
	api.addFiles('server/functions/hasPermission.coffee', ['server']);
	api.addFiles('server/functions/hasRole.coffee', ['server']);
	api.addFiles('server/functions/removeUserFromRoles.coffee', ['server']);

	// publications
	api.addFiles('server/publications/permissions.js', 'server');
	api.addFiles('server/publications/roles.coffee', 'server');
	api.addFiles('server/publications/scopedRoles.js', 'server');
	api.addFiles('server/publications/usersInRole.coffee', 'server');

	// methods
	api.addFiles('server/methods/addUserToRole.coffee', 'server');
	api.addFiles('server/methods/deleteRole.coffee', 'server');
	api.addFiles('server/methods/removeUserFromRole.coffee', 'server');
	api.addFiles('server/methods/saveRole.coffee', 'server');
	api.addFiles('server/methods/addPermissionToRole.coffee', 'server');
	api.addFiles('server/methods/removeRoleFromPermission.coffee', 'server');

	api.addFiles('server/startup.coffee', ['server']);
});
