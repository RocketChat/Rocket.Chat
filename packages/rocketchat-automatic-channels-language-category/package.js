Package.describe({
	name: 'rocketchat:automatic-channels-language-category',
	version: '0.0.1',
	summary: 'language category for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('rocketchat:automatic-channels-handler');

	api.mainModule('server.js', 'server');
	api.addFiles('main.js', 'server');
});

Npm.depends({
	'accept-language-parser': '1.4.0',
	'languages': '0.1.3'
});
