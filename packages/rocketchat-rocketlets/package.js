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

	// Storage
	api.addFiles([
		'server/storage/rl-model.js',
		'server/storage/rl-persistence-model.js',
		'server/storage/storage.js',
		'server/storage/index.js'
	], 'server');

	// Bridges
	api.addFiles([
		'server/bridges/bridges.js',
		'server/bridges/commands.js',
		'server/bridges/environmental.js',
		'server/bridges/messages.js',
		'server/bridges/persistence.js',
		'server/bridges/rooms.js',
		'server/bridges/settings.js',
		'server/bridges/users.js',
		'server/bridges/index.js'
	], 'server');

	// Communication pieces
	api.addFiles([
		'server/communication/rest.js',
		'server/communication/websockets.js',
		'server/communication/index.js'
	], 'server');

	// RocketChat <-> Rocketlet Data Converters
	api.addFiles([
		'server/converters/messages.js',
		'server/converters/rooms.js',
		'server/converters/settings.js',
		'server/converters/users.js',
		'server/converters/index.js'
	], 'server');

	// Server Orchestrator
	api.addFiles('server/orchestrator.js', 'server');

	// Client communication pieces
	api.addFiles([
		'client/communication/websockets.js',
		'client/communication/index.js'
	], 'client');

	// Client orchestrator
	api.addFiles('client/orchestrator.js', 'client');

	api.export('Rocketlets');
});

Npm.depends({
	'busboy': '0.2.13',
	'temporary-rocketlets-server': '0.1.20',
	'temporary-rocketlets-ts-definition': '0.6.11'
});
