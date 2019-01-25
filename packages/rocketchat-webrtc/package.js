Package.describe({
	name: 'rocketchat:webrtc',
	version: '0.0.1',
	summary: 'Package WebRTC for Meteor server',
	git: '',
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:utils',
		'rocketchat:ui-utils',
		'rocketchat:notifications',
		'rocketchat:settings',
		'rocketchat:models',
		'templating',
	]);
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
