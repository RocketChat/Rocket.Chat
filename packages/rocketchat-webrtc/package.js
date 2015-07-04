Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'rocketchat:lib@0.0.1',
		'arunoda:streams@0.1.17'
	]);

	api.addFiles('common.js');
	api.addFiles('adapter.js', ['client']);
	api.addFiles('webrtc.js', ['client']);
	api.addFiles('server.js', ['server']);

	api.export('webrtc')
});


Package.onTest(function(api) {});
