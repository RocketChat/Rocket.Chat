Package.describe({
	name: 'rocketchat:livechat',
	version: '0.0.1',
	summary: 'Livechat plugin for Rocket.Chat',
});

Package.registerBuildPlugin({
	name: 'Livechat',
	use: ['ecmascript'],
	sources: ['plugin/build-livechat.js'],
	npmDependencies: {
		'uglify-js': '2.8.29',
	},
});

Package.onUse(function (api) {
	// livechat app
	api.addAssets('assets/demo.html', 'client');
});
