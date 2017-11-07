Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.2',
	summary: 'RocketChat libraries',
	git: ''
});

Npm.depends({
	'coffee-script': '1.9.3',
	'lru-cache': '2.6.5'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles([
		'server/settings.js',
		'server/server.js'
	], 'server');

	api.export(['Irc'], ['server']);
});
