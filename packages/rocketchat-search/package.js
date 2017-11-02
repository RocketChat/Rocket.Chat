Package.describe({
	name: 'rocketchat:search',
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
	api.mainModule('lib/index.js');
});
