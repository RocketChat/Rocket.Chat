Package.describe({
	name: 'rocketchat:blockstack',
	version: '0.0.1',
	summary: 'Auth handler and utilities for Blockstack',
	git: '',
});

Package.onUse((api) => {
	api.use('ecmascript');

	api.mainModule('server/main.js', 'server');

	api.mainModule('client/main.js', 'client');
});
