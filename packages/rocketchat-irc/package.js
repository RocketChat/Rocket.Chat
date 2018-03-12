Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.1',
	summary: 'RocketChat support for federating with IRC servers as a leaf node',
	git: ''
});

Package.onUse(function (api) {
	api.use([
		'ecmascript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('server/irc.js', 'server');
	api.addFiles('server/irc-settings.js', 'server');
});

Npm.depends({
	'queue-fifo': '0.2.4'
});
