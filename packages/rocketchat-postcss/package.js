Package.describe({
	summary: 'Minifier for Meteor with PostCSS processing',
	version: '1.0.0',
	name: 'rocketchat:postcss'
});

Package.registerBuildPlugin({
	name: 'minifier-postcss',
	use: [
		'ecmascript',
		'minifier-css'
	],
	npmDependencies: {
		'app-module-path': '2.2.0',
		'postcss': '6.0.13',
		'source-map': '0.5.6'
	},
	sources: [
		'plugin/minify-css.js'
	]
});

Package.onUse(function(api) {
	api.use('isobuild:minifier-plugin');
});
