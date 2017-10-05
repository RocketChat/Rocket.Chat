Package.describe({
	name: 'rocketchat:analytics',
	version: '0.0.2',
	summary: 'Analytics integeration for Rocket.Chat',
	git: ''
});

//Note: Piwik respects Google Chrome's No Track: http://piwik.org/docs/privacy/#step-4-respect-donottrack-preference

Package.onUse(function(api) {
	api.use([ 'ecmascript', 'rocketchat:lib' ]);
	api.use([ 'templating', 'kadira:flow-router'], 'client');

	api.addFiles([ 'client/loadScript.js', 'client/trackEvents.js' ], 'client');
	api.addFiles([ 'server/settings.js' ], 'server');
});
