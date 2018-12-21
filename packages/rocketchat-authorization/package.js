Package.describe({
	name: 'rocketchat:authorization',
	version: '0.0.1',
	summary: 'Role based authorization of actions',
	git: '',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'mongo',
		'rocketchat:utils',
	]);
	api.use([
		'templating',
		'tracker',
		'kadira:flow-router',
		'kadira:blaze-layout',
	], 'client');
	api.addFiles('client/stylesheets/permissions.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
