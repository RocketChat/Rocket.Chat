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
