Package.describe({
	name: 'rocketchat:client-commands',
	version: '0.0.1',
	summary: 'Package that implements client commands',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('mongo');
	api.use('ecmascript');
	api.use('templating');
	api.use('babel-compiler');
	api.use('rocketchat:lib');
	api.use('rocketchat:authorization');
	api.use('rocketchat:api');
	api.use('rocketchat:logger');

	api.addFiles('server/startup.js', 'server');
	api.addFiles('server/sendClientCommand.js', 'server')
});
