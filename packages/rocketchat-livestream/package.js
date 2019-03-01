Package.describe({
	name: 'rocketchat:livestream',
	version: '0.0.5',
	summary: 'Embed livestream to Rocket.Chat channels',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:ui-utils',
		'rocketchat:settings',
		'rocketchat:models',
		'rocketchat:callbacks',
		'rocketchat:authorization',
		'rocketchat:lib',
		'rocketchat:api',
		'templating',
	]);
	api.addFiles('client/styles/liveStreamTab.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
