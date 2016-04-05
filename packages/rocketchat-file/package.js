Package.describe({
	name: 'rocketchat:file',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('rocketchat:lib');
	api.use('rocketchat:version');
	api.use('coffeescript');

	api.addFiles('file.server.coffee', 'server');

	api.export('RocketChatFile', 'server');
});

Npm.depends({
	'mkdirp': '0.3.5',
	'gridfs-stream': '0.5.3',
	'gm': '1.18.1'
});
