Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Npm.depends({
	'coffee-script': '1.9.3',
	'lru-cache': '2.6.5'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('irc.server.coffee', 'server');
	api.export(['Irc'], ['server']);
});
