Package.describe({
	name: 'rocketchat:rocketlets',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:api'
	]);

	api.addFiles('lib/Rocketlets.js', ['client', 'server']);

	api.addFiles('server/orchestrator.js', 'server');

	api.addFiles('server/models/Rocketlets.js', 'server');

	// Bridges
	api.addFiles([
		'server/bridges/commands.js'
	], 'server');

	// Communication pieces
	api.addFiles([
		'server/communication/rest.js',
		'server/communication/websockets.js'
	], 'server');

	// Client communication pieces
	api.addFiles([
		'client/communication/websockets.js'
	], 'client');

	api.export('Rocketlets');
});

Npm.depends({
	'temporary-rocketlets-server': '0.1.11',
	'temporary-rocketlets-ts-definition': '0.6.2'
});
