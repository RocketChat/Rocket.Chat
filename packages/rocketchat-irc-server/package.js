Package.describe({
	name: 'rocketchat:irc-server',
	version: '0.0.1',
	summary: 'RocketChat support for federating with IRC servers as a leaf node',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('server/irc-server.js', 'server');
});
