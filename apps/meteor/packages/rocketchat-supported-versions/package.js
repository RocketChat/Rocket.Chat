Package.describe({
	name: 'rocketchat:supported-versions',
	version: '0.0.1',
	summary: 'Supported versions plugin for Rocket.Chat',
});

Package.registerBuildPlugin({
	name: 'supported-versions',
	use: ['ecmascript'],
	sources: ['plugin/build-version.js'],
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.use('isobuild:compiler-plugin@1.0.0');
});
