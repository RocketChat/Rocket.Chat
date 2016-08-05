Package.describe({
	name: 'rocketchat:sandstorm',
	version: '0.0.1',
	summary: 'Sandstorm integeration for Rocket.Chat',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([ 'ecmascript', 'rocketchat:lib' ]);

	api.addFiles([ 'server/lib.js', 'server/events.js', 'server/powerbox.js' ], 'server');
	api.addFiles([ 'client/powerboxListener.js' ], 'client');
});
