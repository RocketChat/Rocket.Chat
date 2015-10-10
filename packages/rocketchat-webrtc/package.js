Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib@0.0.1');
	api.use('coffeescript');

	api.addFiles('adapter.js', 'client');
	api.addFiles('WebRTCClass.coffee', 'client');
	api.addFiles('screenShare.coffee', 'client');

	api.addFiles('server/settings.coffee', 'server');

	api.export('WebRTC');
});


Package.onTest(function(api) {});
