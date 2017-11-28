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

	// Importer information to both server and client
	api.addFiles('info.js');

	// Server files
	api.addFiles(['server/importer.js', 'server/adder.js'], 'server');

	// Client files
	api.addFiles('client/adder.js', 'client');
});

Npm.depends({
	'tar-stream': '1.5.2'
});
