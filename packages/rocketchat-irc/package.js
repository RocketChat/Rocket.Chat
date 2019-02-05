Package.describe({
	name: 'rocketchat:irc',
	version: '0.0.1',
	summary: 'RocketChat support for federating with IRC servers as a leaf node',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'rocketchat:utils',
		'rocketchat:lib',
		'rocketchat:ui',
	]);
	api.mainModule('server/index.js', 'server');
});

Npm.depends({
	'queue-fifo': '0.2.4',
});
