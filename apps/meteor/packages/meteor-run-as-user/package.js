Package.describe({
	name: 'dispatch:run-as-user',
	version: '1.1.1',
	summary: 'Adds Meteor.runAsUser(user, f) and Meteor.isRestricted()',
	git: 'https://github.com/DispatchMe/Meteor-run-as-user.git',
	documentation: 'README.md',
});

Package.onUse(function (api) {

	api.use([
		'meteor',
		'check',
		'underscore',
		'mongo',
		'ddp',
		// 'ddp-common',
		// 'ddp-client'
	]);

	api.addFiles(
		[
			'lib/pre.1.0.3.js', // Waiting for ddp-common and ddp-client
			'lib/common.js',
			'lib/collection.overwrites.js',
		],
		['client', 'server'],
	);
});

// Package.onTest(function (api) {
// 	api.use(['tinytest', 'check', 'mongo', 'accounts-password', 'dispatch:run-as-user']);

// 	api.addFiles([
// 		'tests/test.helpers.js',
// 		'tests/check.environment.js',
// 		'tests/test.js',
// 		'tests/test.loggedin.js',
// 		'tests/test.methods.js',
// 		'tests/test.modifier.restrictions.js',
// 		'tests/test.restrictions.js',
// 		'tests/test.is.admin.js',
// 		'tests/test.outside.invocation.js',
// 	]);
// });
