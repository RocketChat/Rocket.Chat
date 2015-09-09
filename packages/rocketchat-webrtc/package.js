Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib@0.0.1', 'client');

	api.addFiles('adapter.js', 'client');
	api.addFiles('webrtc.js', 'client');

	api.export('webrtc');
});


Package.onTest(function(api) {});
