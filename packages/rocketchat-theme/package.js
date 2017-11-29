Package.describe({
	name: 'rocketchat:theme',
	version: '0.0.1',
	summary: '',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:lib');
	api.use('rocketchat:logger');
	api.use('rocketchat:assets');
	api.use('ecmascript');
	api.use('less');
	api.use('webapp');
	api.use('webapp-hashing');
	api.use('templating', 'client');

	// Compiled stylesheets
	api.addFiles('client/main.css', 'client');

	// Server side files
	api.addFiles('server/server.js', 'server');
	api.addFiles('server/variables.js', 'server');

	// Colorpicker
	api.addFiles('client/vendor/jscolor.js', 'client');

	// Photoswipe
	api.addFiles('client/vendor/photoswipe.css', 'client');

	api.addAssets('client/imports/general/variables.css', 'server');
	// Fontello
	api.addFiles('client/vendor/fontello/css/fontello.css', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.eot', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.svg', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.ttf', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.woff', 'client');
	api.addAssets('client/vendor/fontello/font/fontello.woff2', 'client');

	// Run-time stylesheets
	api.addAssets('server/colors.less', 'server');
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6',
	'less-plugin-autoprefix': '1.4.2'
});
