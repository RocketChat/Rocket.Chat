Package.describe({
	name: 'rocketchat:irc-server',
	version: '0.0.1',
	summary: 'RocketChat support for federating with IRC servers as a leaf node',
	git: ''
});

Npm.depends({
	'coffee-script': '1.9.3'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('server/irc-server.coffee', 'server');
	api.addFiles('server/irc-server-transcript.js', 'server');
});
