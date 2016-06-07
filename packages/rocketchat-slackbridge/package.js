Package.describe({
	name: 'rocketchat:slackbridge',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');

	api.addFiles('logger.js', 'server');
	api.addFiles('settings.js', 'server');
	api.addFiles('slackbridge.js', 'server');
});

Npm.depends({
	'slack-client': '2.0.4'
});
