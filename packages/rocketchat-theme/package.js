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
	api.use('coffeescript');
	api.use('ecmascript');
	api.use('less');
	api.use('underscore');
	api.use('webapp');
	api.use('webapp-hashing');
	api.use('templating', 'client');

	// Server side files
	api.addFiles('server/server.coffee', 'server');
	api.addFiles('server/variables.coffee', 'server');

	// Minicolors
	api.addFiles('client/minicolors/jquery.minicolors.css', 'client');
	api.addFiles('client/minicolors/jquery.minicolors.js', 'client');

	// Fontello
	api.addFiles('client/fontello/css/fontello.css', 'client');
	api.addAssets('client/fontello/font/fontello.eot', 'client');
	api.addAssets('client/fontello/font/fontello.svg', 'client');
	api.addAssets('client/fontello/font/fontello.ttf', 'client');
	api.addAssets('client/fontello/font/fontello.woff', 'client');
	api.addAssets('client/fontello/font/fontello.woff2', 'client');

	// Compiled stylesheets
	api.addFiles('client/main.less', 'client');

	// Run-time stylesheets
	api.addAssets('server/lesshat.less', 'server');
	api.addAssets('server/colors.less', 'server');
});

Npm.depends({
	'less': 'https://github.com/meteor/less.js/tarball/8130849eb3d7f0ecf0ca8d0af7c4207b0442e3f6',
	'less-plugin-autoprefix': '1.4.2'
});
