Package.describe({
	summary: 'Serves a Meteor app over HTTP',
	version: '2.0.7',
});

Npm.depends({
	'cookie-parser': '1.4.6',
	'express': '5.1.0',
	'@types/express': '5.0.1',
	'compression': '1.7.4',
	'errorhandler': '1.5.1',
	'parseurl': '1.3.3',
	'send': '1.1.0',
	'stream-to-string': '1.2.1',
	'qs': '6.13.0',
	'useragent-ng': '2.4.4',
	'tmp': '0.2.3',
});

Npm.strip({
	'multiparty': ['test/'],
	'useragent-ng': ['test/'],
});

// whitelist plugin is now included in the core
Cordova.depends({
	'cordova-plugin-meteor-webapp': '2.0.4',
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.use(
		['logging', 'routepolicy', 'modern-browsers', 'boilerplate-generator', 'webapp-hashing', 'inter-process-messaging', 'callback-hook'],
		'server',
	);

	// At response serving time, webapp uses browser-policy if it is loaded. If
	// browser-policy is loaded, then it must be loaded after webapp
	// (browser-policy depends on webapp). So we don't explicitly depend in any
	// way on browser-policy here, but we use it when it is loaded, and it can be
	// loaded after webapp.
	api.mainModule('webapp_server.js', 'server');
	api.export('WebApp', 'server');
	api.export('WebAppInternals', 'server');
	api.export('main', 'server');

	api.mainModule('webapp_client.js', 'client');
	api.export('WebApp', 'client');

	api.mainModule('webapp_cordova.js', 'web.cordova');
	api.addAssets('webapp.d.ts', 'server');
});

Package.onTest(function (api) {
	api.use(['tinytest', 'ecmascript', 'webapp', 'http', 'fetch', 'test-helpers']);
	api.addFiles('webapp_tests.js', 'server');
	api.addFiles('webapp_client_tests.js', 'client');
	api.addFiles('socket_file_tests.js', 'server');

	api.addAssets('modern_test_asset.js', 'web.browser');
	api.addAssets('legacy_test_asset.js', 'legacy');
});
