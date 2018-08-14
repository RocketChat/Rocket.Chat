Package.describe({
	name: 'rocketchat:importer-slack',
	version: '0.0.1',
	summary: 'Importer for Slack',
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
