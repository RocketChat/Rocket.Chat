Package.describe({
	name: 'rocketchat:retention-policy',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'littledata:synced-cron',
		'rocketchat:lib',
		'rocketchat:models',
		'rocketchat:settings',
	]);
	api.mainModule('server/index.js', 'server');
});
