Package.describe({
	name: 'rocketchat:rocketlets',
	version: '1.0.0'
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'rocketchat:lib',
		'rocketchat:api',
		'templating'
	]);

	api.use(['reactive-var', 'kadira:flow-router', 'underscore'], 'client');

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
		'server/bridges/activation.js',
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

	// Client Admin Management
	api.addFiles([
		'client/admin/rocketlets.html',
		'client/admin/rocketlets.js',
		'client/admin/rocketletManage.html',
		'client/admin/rocketletManage.js',
		'client/admin/rocketletInstall.html',
		'client/admin/rocketletInstall.js'
	], 'client');

	api.addFiles('assets/stylesheets/rocketlets.css', 'client');

	// Client orchestrator
	api.addFiles('client/orchestrator.js', 'client');

	// Add what this package actually does export
	api.export('Rocketlets');
});

Npm.depends({
	'busboy': '0.2.13',
	'temporary-rocketlets-server': '0.2.1',
	'temporary-rocketlets-ts-definition': '0.6.33'
});

// TODO: Save whether a rocketlet is enabled or not, that way when the server restarts it doesn't enable one that isn't enabled
