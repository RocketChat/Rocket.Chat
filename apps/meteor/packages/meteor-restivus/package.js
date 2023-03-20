Package.describe({
	name: 'rocketchat:restivus',
	summary: 'Create authenticated REST APIs in Meteor 0.9+ via HTTP/HTTPS. Setup CRUD endpoints for Collections.',
	version: '1.1.0',
	git: 'https://github.com/kahmali/meteor-restivus.git',
});

Package.onUse(function (api) {
	// Minimum Meteor version
	api.versionsFrom('2.5');

	// Meteor dependencies
	api.use('check');
	api.use('ecmascript');
	api.use('underscore');
	api.use('accounts-password');
	api.use('simple:json-routes@2.3.1');

	api.mainModule('lib/restivus.js', 'server');
});

// Package.onTest(function (api) {
//   // Meteor dependencies
//   api.use('practicalmeteor:munit');
//   api.use('test-helpers');
//   api.use('rocketchat:restivus');
//   api.use('http');
//   api.use('coffeescript');
//   api.use('underscore');
//   api.use('accounts-base');
//   api.use('accounts-password');
//   api.use('mongo');

//   api.addFiles('lib/route.coffee', 'server');
//   api.addFiles('test/api_tests.coffee', 'server');
//   api.addFiles('test/route_unit_tests.coffee', 'server');
//   api.addFiles('test/authentication_tests.coffee', 'server');
//   api.addFiles('test/user_hook_tests.coffee', 'server');
// });
