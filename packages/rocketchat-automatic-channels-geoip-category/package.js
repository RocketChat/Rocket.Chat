Package.describe({
	name: 'rocketchat:automatic-channels-geoip-category',
	version: '0.0.1',
	summary: 'geoip category for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:automatic-channels-handler');

	api.mainModule('server.js', 'server');
	api.addFiles('main.js', 'server');
});

Npm.depends({
	'satelize': '0.2.0'
});
