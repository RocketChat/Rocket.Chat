Package.describe({
	name: 'rocketchat:videoconference',
	version: '0.1.0',
	summary: 'Video Conference',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'underscore',
		'less',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client/tabBar.js', 'client');
	api.addFiles('client/actionLink.js', 'client');

	//Need to register the messageType with both the server and client
	api.addFiles('lib/messageType.js', ['client', 'server']);
	//api.addFiles('lib/roomType.js', ['client', 'server']);

	api.addFiles('lib/videoConferenceProvidersCommon.js', ['client', 'server']);
	api.addFiles('server/videoConferenceProviders.js', ['server']);
	api.addFiles('client/videoConferenceProviders.js', ['client']);

	api.addFiles('server/settings.js', 'server');
	//api.addFiles('server/methods/startCall.js', 'server');
	api.addFiles('server/actionLink.js', 'server');
});
