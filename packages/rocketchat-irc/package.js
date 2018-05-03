Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.2',
	summary: 'RocketChat libraries',
	git: ''
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
