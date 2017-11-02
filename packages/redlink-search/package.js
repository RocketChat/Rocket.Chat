Package.describe({
	name: 'redlink:search',
	version: '0.0.1',
	summary: 'Full-text search for RocketChat - open source provided by Redlink',
	git: 'https://github.com/redlink-gmbh/rocket-search',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.5.2.2');
	api.use('ecmascript');
	api.use('rocketchat:search');

	api.addFiles('lib/SearchProvider.js');

	api.mainModule('redlink-search.js');
});

/*Package.onTest(function(api) {
	api.use('ecmascript');
	api.use('tinytest');
	api.use('redlink:search');
});*/
