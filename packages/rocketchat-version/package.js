Package.describe({
	name: 'rocketchat:version',
	summary: '',
	version: '1.0.0'
});

Package.registerBuildPlugin({
	name: 'compileVersion',
	use: ['coffeescript'],
	sources: ['plugin/compile-version.coffee']
});

Package.onUse(function(api) {
	api.use('isobuild:compiler-plugin@1.0.0');
});
