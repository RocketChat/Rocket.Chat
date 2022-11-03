Package.describe({
	name: 'rocketchat:postcss',
	version: '1.0.0',
	summary: 'CSS post-processing with PostCSS',
});

Package.registerBuildPlugin({
	name: 'postcss',
	use: ['ecmascript', 'minifier-css'],
	sources: ['build.js'],
});

Package.onUse((api) => {
	api.use('isobuild:minifier-plugin@1.0.0');
});
