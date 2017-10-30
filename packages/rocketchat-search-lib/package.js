Package.describe({
	name: 'rocketchat:search-lib',
	version: '0.0.1',
	summary: 'This package exposes an API to integrate search providers',
	git: '',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.5.2.2');
	api.use('ecmascript');
	api.use('rocketchat:lib');

	// publicly visible artifacts
	api.mainModule('server/lib/index.js', 'server');
	api.mainModule('client/lib/index.js', 'client');
});

Package.onTest(function(api) {
	api.use('ecmascript');
	api.use('tinytest');
	api.use('rocketchat:search');
	api.mainModule('search-lib-tests.js');
});
