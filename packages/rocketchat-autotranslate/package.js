Package.describe({
	name: 'rocketchat:autotranslate',
	version: '0.0.1',
	summary: 'Rocket.Chat automatic translations',
	git: ''
});

Package.onUse(function(api) {
	api.use([ 'ecmascript', 'rocketchat:lib' ]);
	api.use([ 'templating', 'kadira:flow-router'], 'client');

	// api.addFiles([ 'client/loadScript.js', 'client/trackEvents.js' ], 'client');
	api.addFiles([ 'server/settings.js', 'server/autotranslate.js', 'server/models/Messages.js' ], 'server');
});
