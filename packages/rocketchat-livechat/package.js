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

	api.use(['webapp', 'autoupdate'], 'server');
	api.use('ecmascript');
	api.use('alanning:roles@1.2.12');
	api.use('rocketchat:lib');
	api.use('kadira:flow-router', 'client');
	api.use('templating', 'client');
	api.use('mongo');

	api.addFiles('livechat.js', 'server');
	api.addFiles('server/methods.js', 'server');
	api.addFiles('server/startup.js', 'server');
	api.addFiles('permissions.js', 'server');

	api.addFiles('config.js', 'server');

	api.addFiles('client/ui.js', 'client');
	api.addFiles('client/route.js', 'client');

	// client views
	api.addFiles('client/views/app/livechatManager.html', 'client');
	api.addFiles('client/views/app/livechatManager.js', 'client');
	api.addFiles('client/views/app/livechatDepartments.html', 'client');
	api.addFiles('client/views/app/livechatDepartments.js', 'client');
	api.addFiles('client/views/app/livechatDepartmentForm.html', 'client');
	api.addFiles('client/views/app/livechatDepartmentForm.js', 'client');
	api.addFiles('client/views/sideNav/livechat.html', 'client');
	api.addFiles('client/views/sideNav/livechat.js', 'client');
	api.addFiles('client/views/sideNav/livechatFlex.html', 'client');
	api.addFiles('client/views/sideNav/livechatFlex.js', 'client');

	// methods
	api.addFiles('server/methods/addAgent.js', 'server');
	api.addFiles('server/methods/addManager.js', 'server');
	api.addFiles('server/methods/saveDepartment.js', 'server');
	api.addFiles('server/methods/searchAgent.js', 'server');
	api.addFiles('server/methods/removeAgent.js', 'server');
	api.addFiles('server/methods/removeManager.js', 'server');
	api.addFiles('server/methods/removeDepartment.js', 'server');
	// models
	api.addFiles('server/models/Users.js', 'server');
	api.addFiles('server/models/LivechatDepartment.js', 'server');

	// collections
	api.addFiles('client/lib/LivechatDepartment.js', 'client');

	// publications
	api.addFiles('server/publications/livechatAgents.js', 'server');
	api.addFiles('server/publications/livechatManagers.js', 'server');
	api.addFiles('server/publications/livechatDepartments.js', 'server');
	api.addFiles('server/publications/visitorRoom.js', 'server');

	// livechat app
	api.addAssets('rocket-livechat.js', 'client');
	api.addAssets('public/livechat.css', 'client');
	api.addAssets('public/livechat.js', 'client');
	api.addAssets('public/head.html', 'server');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-livechat/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-livechat/i18n/' + filename).size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n', ['client', 'server']);
	// api.imply('tap:i18n');
	api.addFiles(tapi18nFiles, ['client', 'server']);
});
