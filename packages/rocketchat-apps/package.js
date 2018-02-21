Package.describe({
	name: 'rocketchat:apps',
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

	api.addFiles('lib/Apps.js', ['client', 'server']);

	// Storage
	api.addFiles([
		'server/storage/apps-logs-model.js',
		'server/storage/apps-model.js',
		'server/storage/apps-persistence-model.js',
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
		'server/communication/methods.js',
		'server/communication/rest.js',
		'server/communication/websockets.js',
		'server/communication/index.js'
	], 'server');

	// RocketChat <-> App Data Converters
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
		'client/admin/apps.html',
		'client/admin/apps.js',
		'client/admin/appManage.html',
		'client/admin/appManage.js',
		'client/admin/appInstall.html',
		'client/admin/appInstall.js',
		'client/admin/appLogs.html',
		'client/admin/appLogs.js'
	], 'client');

	api.addFiles('assets/stylesheets/apps.css', 'client');

	// Client orchestrator
	api.addFiles('client/orchestrator.js', 'client');

	// Add what this package actually does export (needs updated to the module import style)
	api.export('Apps');
});

Npm.depends({
	'busboy': '0.2.13',
	'@rocket.chat/apps-engine': '0.3.7',
	'@rocket.chat/apps-ts-definition': '0.7.6'
});
