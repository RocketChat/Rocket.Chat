Package.describe({
	name: 'rocketchat:ui-sidenav',
	version: '0.1.0',
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
		'ecmascript',
		'templating',
		'rocketchat:callbacks',
		'rocketchat:authorization',
		'rocketchat:settings',
		'rocketchat:utils',
		'rocketchat:ui-utils',
		'rocketchat:models',
		'rocketchat:lazy-load',
	]);
	api.mainModule('client/index.js', 'client');
});

