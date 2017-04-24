Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('ecmascript');

	api.use('templating', 'client');
	api.mainModule('client/WebRTCClass.js', 'client');
	api.addFiles('client/adapter.js', 'client');
	// api.addFiles(');
	api.addFiles('client/screenShare.js', 'client');

	api.addFiles('server/settings.js', 'server');

	api.export('WebRTC', 'client');
});
