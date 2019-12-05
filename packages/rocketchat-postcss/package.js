Package.describe({
	name: 'rocketchat:postcss',
	version: '1.0.0',
	summary: 'CSS post-processing with PostCSS',
});

Package.registerBuildPlugin({
	name: 'postcss',
	use: [
		'ecmascript',
		'minifier-css',
	],
	npmDependencies: {
		'source-map': '0.5.6',
		'app-module-path': '2.2.0',
	},
	sources: [
		'build.js',
	],
});

Package.onUse((api) => {
	api.use('isobuild:minifier-plugin@1.0.0');
});
