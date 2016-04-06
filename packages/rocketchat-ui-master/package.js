Package.describe({
	name: 'rocketchat:ui-master',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');

	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'coffeescript',
		'underscore',
		'rocketchat:lib',
		'meteorhacks:inject-initial',
		'meteorhacks:fast-render'
	]);

	api.addFiles('master/main.html', 'client');
	api.addFiles('master/loading.html', 'client');
	api.addFiles('master/pageLoading.html', 'client');
	api.addFiles('master/error.html', 'client');
	api.addFiles('master/logoLayout.html', 'client');

	api.addFiles('master/main.coffee', 'client');

	api.addFiles('server/inject.js', 'server');
	api.addFiles('server/fastRender.js', 'server');
});
