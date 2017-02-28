Package.describe({
	name: 'rocketchat:importer-hipchat-enterprise',
	version: '1.0.0',
	summary: 'Importer for Hipchat Importer Files',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:importer'
	]);

	api.use('rocketchat:logger', 'server');
	api.addFiles('server.js', 'server');
	api.addFiles('main.js', ['client', 'server']);
});

Npm.depends({
	'tar-stream': '1.5.2'
});
