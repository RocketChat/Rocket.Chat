Package.describe({
	name: 'rocketchat:geoip-plugin',
	version: '0.0.1',
	summary: 'geoip plugin for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:plugin-handler');

	api.addFiles('server/server.js', 'server');
});

Npm.depends({
	'satelize': '0.2.0'
});
