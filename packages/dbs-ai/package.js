Package.describe({
	name: 'dbs:ai',
	version: '0.0.1',
	summary: 'Integration of artifical knowledge',
	git: '', //not hosted on separaete git repo yet - use http://github.com/mrsimpson/Rocket.Chat
	documentation: 'README.md'
});

function addDirectory(api, pathInPackage, environment) {
	const PACKAGE_PATH = 'packages/dbs-ai/';
	const _ = Npm.require('underscore');
	const fs = Npm.require('fs');
	const files = _.compact(_.map(fs.readdirSync(PACKAGE_PATH + pathInPackage), function (filename) {
		return pathInPackage + '/' + filename
	}));
	api.addFiles(files, environment);
}

Package.onUse(function (api) {

	api.use(['ecmascript', 'underscore']);
	api.use('templating', 'client');
	api.use('less@2.5.1');
	api.use('rocketchat:lib');
	api.use('dbs:common');

	api.addAssets('assets/stylesheets/redlink.less', 'server');

	api.addAssets('assets/icons/sapTransaction.png', 'client');
	api.addAssets('assets/icons/peerToPeerHelp.png', 'client');
	api.addAssets('assets/icons/communication.png', 'client');

	api.addFiles('server/config.js', 'server');
	addDirectory(api, 'server/methods', 'server');
	addDirectory(api, 'server/lib', 'server');
	addDirectory(api, 'server/hooks', 'server');

	api.addFiles('client/redlink_ui.js', 'client');
	addDirectory(api,'client/views/app/tabbar', 'client');

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/dbs-ai/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');
});
