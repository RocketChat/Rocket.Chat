Package.describe({
	name: 'rocketchat:version',
	summary: '',
	version: '1.0.0',
});

Package.registerBuildPlugin({
	name: 'compileVersion',
	use: ['ecmascript'],
	sources: ['plugin/compile-version.js'],
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.use('isobuild:compiler-plugin@1.0.0');
});
