Package.describe({
	name: 'rocketchat:slackbridge',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');

	api.addFiles('client/slackbridge_import.client.js', 'client');
	api.addFiles('server/logger.js', 'server');
	api.addFiles('server/settings.js', 'server');
	api.addFiles('server/slackbridge.js', 'server');
	api.addFiles('server/slackbridge_import.server.js', 'server');
	api.addFiles('server/RocketAdapter.js', 'server');
	api.addFiles('server/SlackAdapter.js', 'server');
});

Npm.depends({
	'slack-client': '2.0.6'
});
