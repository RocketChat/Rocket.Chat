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

	api.use(['ecmascript', 'webapp', 'autoupdate'], 'server');

	api.imply('alanning:roles@1.2.12');
	api.use('kadira:flow-router', 'client');

	api.addFiles('livechat.js', 'server');
	api.addFiles('server/methods.js', 'server');
	api.addFiles('server/publications.js', 'server');
	api.addFiles('permissions.js', 'server');

	api.addFiles('config.js', 'server');

	api.addFiles('client/ui.js', 'client');
	api.addFiles('client/route.js', 'client');
	api.addFiles('client/views/sideNav/livechat.html', 'client');
	api.addFiles('client/views/sideNav/livechat.js', 'client');

	api.addAssets('rocket-livechat.js', 'client');
	api.addAssets('public/livechat.css', 'client');
	api.addAssets('public/livechat.js', 'client');
	api.addAssets('public/head.html', 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-livechat/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-livechat/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n@1.6.1', ['client', 'server']);
	api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});
