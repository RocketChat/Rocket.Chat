Package.describe({
	name: 'rocketchat:sau',
	version: '0.0.1',
	summary: 'Server Session Monitor for SAU(Simultaneously Active Users)',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');
	/*
	api.use('templating', 'client');
	api.mainModule('client/WebRTCClass.js', 'client');
	api.addFiles('client/adapter.js', 'client');
	// api.addFiles(');
	api.addFiles('client/screenShare.js', 'client');

	api.addFiles('server/settings.js', 'server');

	api.export('WebRTC', 'client');
	*/

	api.addFiles([
		'server/models/Sessions.js'
	], 'server');

});
