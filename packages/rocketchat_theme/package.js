Package.describe({
	name: 'rocketchat:theme',
	version: '0.0.1',
	summary: '',
	git: '',
});
Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'less',
		'webapp',
		'webapp-hashing',
		'rocketchat:settings',
		'rocketchat:logger',
		'templating',
		'juliancwirko:postcss',
	]);
	// Compiled stylesheets
	api.addFiles('client/main.css', 'client');
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
	api.mainModule('client/index.js', 'client');
	api.mainModule('server/index.js', 'server');
});
