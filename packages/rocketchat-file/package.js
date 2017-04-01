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

Npm.depends({
	'mkdirp': '0.5.1',
	'gridfs-stream': '1.1.1',
	'gm': '1.23.0'
});
