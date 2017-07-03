Package.describe({
	name: 'rocketchat:geoip-plugin',
	version: '0.0.1',
	summary: 'geoip plugin for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:plugin-handler');

	api.add_files('server/server.js', 'server');
	api.export('get_country');
});

Npm.depends({
	'satelize': '0.2.0'
});
