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

	// Storage
	api.addFiles([
		'server/storage/rl-model.js',
		'server/storage/storage.js',
		'server/storage/index.js'
	], 'server');

	// Bridges
	api.addFiles([
		'server/bridges/bridges.js',
		'server/bridges/commands.js',
		'server/bridges/environmental.js',
		'server/bridges/settings.js',
		'server/bridges/index.js'
	], 'server');

	// Communication pieces
	api.addFiles([
		'server/communication/rest.js',
		'server/communication/websockets.js',
		'server/communication/index.js'
	], 'server');

	api.addFiles([
		'server/converters/messages.js',
		'server/converters/rooms.js',
		'server/converters/settings.js',
		'server/converters/users.js',
		'server/converters/index.js'
	], 'server');

	// Client communication pieces
	api.addFiles([
		'client/communication/websockets.js'
	], 'client');

	api.export('Rocketlets');
});

Npm.depends({
	'temporary-rocketlets-server': '0.1.12',
	'temporary-rocketlets-ts-definition': '0.6.2'
});
