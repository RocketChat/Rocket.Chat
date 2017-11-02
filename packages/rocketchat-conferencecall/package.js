Package.describe({
	name: 'rocketchat:conferencecall',
	version: '0.1.0',
	summary: 'Conference Call',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'modules',
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

	api.addFiles('lib/conferenceCallProvidersCommon.js', ['client', 'server']);
	api.addFiles('lib/conferenceCallTypes.js', ['client', 'server']);
	api.addFiles('lib/conferenceCallProvider.js', ['client', 'server']);
	api.addFiles('server/conferenceCallProviders.js', ['server']);
	api.addFiles('client/conferenceCallProviders.js', ['client']);

	api.addFiles('server/settings.js', 'server');
	//api.addFiles('server/methods/startCall.js', 'server');
	api.addFiles('server/actionLink.js', 'server');

	api.mainModule('lib/index.js', ['client', 'server']);
});
