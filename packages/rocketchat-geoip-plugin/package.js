Package.describe({
	name: 'rocketchat:geoip-plugin',
	version: '0.0.1',
	summary: 'geoip plugin for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('accounts-base');
	api.use('ecmascript');
	api.use('rocketchat:lib');

	api.add_files('server/server.js', 'server');
});


