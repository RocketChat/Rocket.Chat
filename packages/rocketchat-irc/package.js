Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.1',
	summary: 'RocketChat libraries',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('irc.server.coffee', 'server');

	api.export(['Irc'], ['server']);
});

Package.onTest(function(api) {});
