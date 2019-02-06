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
		'rocketchat:lib',
		'rocketchat:api',
		'rocketchat:ui',
		'templating',
	]);
	api.addFiles('client/styles/liveStreamTab.css', 'client');
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
	Npm.depends({
		googleapis: '25.0.0',
	});
});
