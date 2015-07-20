Package.describe({
	name: 'rocketchat:webrtc-ib',
	version: '0.0.1',
	summary: 'Package WebRTC In-band Signaling for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1'
	]);

	api.addFiles('adapter.js', ['client']);
	api.addFiles('webrtc.js', ['client']);
	api.addFiles('webrtcmsg.coffee', ['client']);

	api.export('webrtc')
});


Package.onTest(function(api) {});
