Package.describe({
	name: 'rocketchat:automatic-channels-handler',
	version: '0.0.1',
	summary: 'automatic channels handler for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('accounts-base');
	api.use('ecmascript');
	api.use('rocketchat:lib');

	api.mainModule('server/server.js', 'server');
	api.addFiles('server/settings.js', 'server');
});


