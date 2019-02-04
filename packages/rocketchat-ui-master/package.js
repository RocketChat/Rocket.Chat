Package.describe({
	name: 'rocketchat:ui-master',
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
		'mongo',
		'ecmascript',
		'templating',
		'reactive-var',
		'rocketchat:utils',
		'rocketchat:tooltip',
		'rocketchat:ui-utils',
		'rocketchat:ui-sidenav',
		'meteorhacks:inject-initial',
	]);
	api.addFiles('client/main.html', 'client');
	api.addFiles('client/main.js', 'client');

	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');

	api.addAssets('server/dynamic-css.js', 'server');
	api.addAssets('public/icons.svg', 'server');
});
