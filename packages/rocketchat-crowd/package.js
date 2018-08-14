Package.describe({
	name: 'rocketchat:crowd',
	version: '1.0.0',
	summary: 'Accounts login handler for crowd using atlassian-crowd-client from npm',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:logger');
	api.use('rocketchat:lib');
	api.use('ecmascript');
	api.use('sha');

	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.addFiles('client/loginHelper.js', 'client');
	api.addFiles('server/crowd.js', 'server');
	api.addFiles('server/settings.js', 'server');

	api.export('CROWD', 'server');
});
