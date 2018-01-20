Package.describe({
	name: 'rocketchat:file',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('rocketchat:version');
	api.use('ecmascript');

	api.addFiles('file.server.js', 'server');

	api.export('RocketChatFile', 'server');
});
