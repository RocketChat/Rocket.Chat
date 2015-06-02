Package.describe({
	name: 'rocket:file',
	version: '0.0.1',
	summary: '',
	git: ''
});

Npm.depends({
	'mkdirp': '0.3.5',
	'gridfs-stream': '0.5.3'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use('coffeescript');

	api.addFiles('file.server.coffee', 'server');

	api.export(['RocketFile'], ['server']);
});

Package.onTest(function(api) {

});