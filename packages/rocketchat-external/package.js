Package.describe({
	name: 'rocketchat:external',
	version: '0.0.1',
	summary: 'External for Rocket.Chat'
});

Package.registerBuildPlugin({
	name: "builExternal",
	use: [],
	sources: [
		'plugin/build-external.js'
	],
	npmDependencies: {
		"shelljs": "0.5.1"
	}
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use(['coffeescript', 'webapp', 'autoupdate'], 'server');

	api.addFiles('external.coffee', 'server');
	api.addFiles('methods.coffee', 'server');
	api.addFiles('publications.coffee', 'server');

	api.addFiles('rocket-external.js', 'client', {isAsset: true});
	api.addFiles('public/external.css', 'client', {isAsset: true});
	api.addFiles('public/external.js', 'client', {isAsset: true});
	api.addFiles('public/head.html', 'server', {isAsset: true});
});
