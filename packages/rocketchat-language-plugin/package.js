Package.describe({
	name: 'rocketchat:language-plugin',
	version: '0.0.1',
	summary: 'language plugin for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:plugin-handler');
	api.use('rocketchat:lib');

	api.mainModule('server/server.js', 'server');
});

Npm.depends({
	'accept-language-parser': '1.4.0',
	'languages': '0.1.3'
});
