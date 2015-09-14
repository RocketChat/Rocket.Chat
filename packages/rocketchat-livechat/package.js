Package.describe({
	name: 'rocketchat:livechat',
	version: '0.0.1',
	summary: 'Livechat plugin for Rocket.Chat'
});

Package.registerBuildPlugin({
	name: "builLivechat",
	use: [],
	sources: [
		'plugin/build-livechat.js'
	],
	npmDependencies: {
		"shelljs": "0.5.1"
	}
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use(['coffeescript', 'webapp', 'autoupdate'], 'server');

	api.addFiles('livechat.coffee', 'server');
	api.addFiles('methods.coffee', 'server');
	api.addFiles('publications.coffee', 'server');

	api.addFiles('rocket-livechat.js', 'client', {isAsset: true});
	api.addFiles('public/livechat.css', 'client', {isAsset: true});
	api.addFiles('public/livechat.js', 'client', {isAsset: true});
	api.addFiles('public/head.html', 'server', {isAsset: true});
});
