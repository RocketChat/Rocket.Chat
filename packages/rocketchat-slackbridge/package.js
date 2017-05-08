Package.describe({
	name: 'rocketchat:slackbridge',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:api');
	api.use('rocketchat:lib');
	api.use('rocketchat:file');
	api.use('rocketchat:logger');
	api.use('matb33:collection-hooks');

	// client
	api.addFiles('client/slashcommand/slackbridge_import.client.js', 'client');

	// server
	api.addFiles('server/api/api.js', 'server');

	api.addFiles('server/models/Users.js');
	api.addFiles('server/models/Messages.js');

	api.addFiles('server/logger.js', 'server');
	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/slackbridge.js', 'server');
	api.addFiles('server/slashcommand/slackbridge_import.server.js', 'server');
});

Npm.depends({
	'@slack/client': '3.9.0',
	'@slack/events-api': '1.0.1',
	'request': '2.81.0'
});
